import ffmpeg_static from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(ffmpeg_static);

import { Router } from 'express';
import ytdl from 'ytdl-core';
const router = Router();
import path from 'path';
import fs from 'fs';
import formats from '../utils/formats';
import { getExtension, getContainer } from '../utils/mime';

const temp = path.join(__dirname, '../temp');

router.post('/convert', async (req, res) => {
	try {
		const url = req.body.url;
		const videoiTag = req.body['video-itag'];
		const audioiTag = req.body['audio-itag'];
		const convertMP3 = typeof req.body['convert-mp3'] !== 'undefined';

		let id = '';
		let hasVideo = false;
		let hasAudio = false;
		let videoMime = '';
		let audioMime = '';

		if (typeof url === 'undefined') throw new Error('URL is undefined');
		else id = ytdl.getVideoID(url);

		if (typeof videoiTag === 'undefined') {
			throw new Error('Video iTag is undefined');
		} else if (videoiTag !== 'none') {
			hasVideo = true;
			videoMime = formats[videoiTag].mimeType;
			if (videoMime === null) throw new Error('Unknown video iTag value');
		}

		if (typeof audioiTag === 'undefined') {
			throw new Error('Audio iTag is undefined');
		} else if (audioiTag !== 'none') {
			hasAudio = true;
			audioMime = formats[audioiTag].mimeType;
			if (audioMime === null) throw new Error('Unknown audio iTag value');
		}

		if (!hasVideo && !hasAudio) {
			throw new Error('Atleast 1 audio or video format should be included');
		}

		const resultMime = hasVideo ? videoMime : convertMP3 ? 'audio/mpeg' : audioMime;
		const ext = getExtension(resultMime);

		const videoTempname = `${id}_${videoiTag}`;
		const videoTemp = path.join(temp, videoTempname);
		const audioTempname = `${id}_${audioiTag}`;
		const audioTemp = path.join(temp, audioTempname);
		const mp3Tempname = `${audioTempname}-mp3`;
		const mp3Temp = path.join(temp, mp3Tempname);

		const videoData: ytdl.videoInfo | null = await ytdl.getInfo(id).catch(() => null);
		if (videoData === null) throw new Error('Video data is null');

		let videoPipe = Promise.resolve(null);
		let audioPipe = Promise.resolve(null);
		let result = null;

		if (hasVideo && !fs.existsSync(videoTemp)) {
			const videoWrite = fs.createWriteStream(videoTemp);
			const videoStream = ytdl(url, { quality: videoiTag });
			videoStream.pipe(videoWrite);
			videoPipe = new Promise((resolve, reject) => {
				videoWrite.on('finish', resolve);
				videoWrite.on('error', reject);
			});
		}

		if (hasAudio && !fs.existsSync(audioTemp)) {
			const audioWrite = fs.createWriteStream(audioTemp);
			const audioStream = ytdl(url, { quality: audioiTag });
			audioStream.pipe(audioWrite);
			audioPipe = new Promise((resolve, reject) => {
				audioWrite.on('finish', resolve);
				audioWrite.on('error', reject);
			});
		}

		await Promise.all([videoPipe, audioPipe]);
		if (hasAudio && fs.existsSync(audioTemp) && convertMP3 && !fs.existsSync(mp3Temp)) {
			await new Promise((resolve, reject) => {
				const author = videoData.videoDetails.author.name.endsWith('- Topic')
					? videoData.videoDetails.author.name.substring(0, videoData.videoDetails.author.name.length - 8)
					: videoData.videoDetails.author.name;

				const title = videoData.videoDetails.title;

				const audioCont = getContainer(audioMime);
				ffmpeg()
					.input(audioTemp)
					.inputFormat(audioCont)
					.on('error', reject)
					.on('end', resolve)
					.format('mp3')
					.outputOptions(['-c:a libmp3lame', '-q:a 4', `-id3v2_version 3`])
					.outputOptions('-metadata', `artist=${author}`)
					.outputOptions('-metadata', `title=${title}`)
					.output(mp3Temp)
					.run();
			});
		}

		res.status(200);

		if (hasVideo && hasAudio) {
			const outname = `${id}_${videoiTag}_${audioiTag + (convertMP3 ? '-mp3' : '')}`;
			const outpath = path.join(temp, outname);

			if (!fs.existsSync(outpath)) {
				const videoCont = getContainer(videoMime);
				const audioCont = convertMP3 ? 'mp3' : getContainer(audioMime);
				let audio = '';

				switch (videoCont) {
					case 'mp4':
						audio = convertMP3 ? 'libmp3lame' : 'aac';
						break;

					case 'webm':
						audio = 'libopus';
						break;

					default:
						audio = 'copy';
				}

				await new Promise((resolve, reject) => {
					const author = videoData.videoDetails.author.name.endsWith('- Topic')
						? videoData.videoDetails.author.name.substring(0, videoData.videoDetails.author.name.length - 8)
						: videoData.videoDetails.author.name;

					const title = videoData.videoDetails.title;

					ffmpeg()
						.input(videoTemp)
						.inputFormat(videoCont)
						.input(convertMP3 ? mp3Temp : audioTemp)
						.inputFormat(convertMP3 ? 'mp3' : audioCont)
						.on('error', reject)
						.on('end', resolve)
						.format(ext)
						.outputOptions(['-c:v copy', `-c:a ${audio}`])
						.outputOptions('-metadata', `artist=${author}`)
						.outputOptions('-metadata', `title=${title}`)
						.output(outpath)
						.run();
				});
			}

			result = outname;
		} else if (hasVideo) {
			result = videoTempname;
		} else if (hasAudio) {
			result = convertMP3 ? mp3Tempname : audioTempname;
		}

		res.json({ success: true, result });
	} catch (error: any) {
		console.log(error);
		res.status(400).json({
			message: 'Unable to convert video',
			error: error.message
		});
	}
});

router.get('/download', async (req, res) => {
	const resultId = (req.query['id'] as string) || null;
	const filename = req.query['filename'] || resultId;

	if (resultId === null) {
		res.status(400).send('No ID');
		return;
	}

	const regex = /^([a-z0-9_-]{11})_([0-9]+)(_([0-9]+))?(-mp3)?$/i;
	const match = resultId.match(regex);
	if (match === null) {
		res.status(400).send('Invalid result ID');
		return;
	}

	const temp = path.join(__dirname, '../temp/');
	const filepath = path.join(temp, resultId);
	if (!fs.existsSync(filepath)) {
		res.status(400).send('Convert the ID first');
		return;
	}

	let videoiTag = null;
	let audioiTag = null;
	if (typeof match[2] !== 'undefined') {
		const mime = formats[match[2]].mimeType;
		if (mime.startsWith('audio')) audioiTag = match[2];
		else if (mime.startsWith('video')) videoiTag = match[2];
	}

	if (typeof match[4] !== 'undefined') {
		const mime = formats[match[4]].mimeType;
		if (mime.startsWith('audio')) audioiTag = match[4];
		else if (mime.startsWith('video')) videoiTag = match[4];
	}

	const convertedMP3 = typeof match[5] !== 'undefined';
	const videoMime = videoiTag !== null ? formats[videoiTag].mimeType : false;
	const audioMime = audioiTag !== null ? (convertedMP3 ? 'audio/mpeg' : formats[audioiTag].mimeType) : false;

	const resultMime = videoMime || audioMime;
	const ext = getExtension(resultMime);
	const resultName = encodeURIComponent(`${filename}.${ext}`);

	res.status(200);
	res.set('Content-Disposition', `attachment; filename=${resultName}`);
	res.set('Content-Type', resultMime);
	fs.createReadStream(filepath).pipe(res);
});

router.get('/getVideo', async (req, res) => {
	try {
		const id = req.query['id'] as string;
		const info = await ytdl.getInfo(id);
		const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
		const videoFormats = ytdl.filterFormats(info.formats, 'videoonly');
		res.status(200).json({ ...info, audioFormats, videoFormats });
	} catch (error: any) {
		res.status(400).json({
			message: 'La ID del video no es valida',
			error: error.message
		});
	}
});

export default router;
