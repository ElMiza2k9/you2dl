const formats = require('ytdl-core/lib/formats.js');

formats[256] = {
	mimeType: 'audio/mp4; codecs="aac"',
	qualityLabel: null,
	bitrate: null,
	audioBitrate: 192
};

formats[258] = {
	mimeType: 'audio/m4a; codecs="aac"',
	qualityLabel: null,
	bitrate: null,
	audioBitrate: 384
};

formats[394] = {
	mimeType: 'video/mp4; codecs="av01.0.00M.08"',
	qualityLabel: '144p',
	bitrate: 0,
	audioBitrate: null
};

formats[395] = {
	mimeType: 'video/mp4; codecs="av01.0.00M.08"',
	qualityLabel: '240p',
	birate: 0,
	audioBitrate: null
};

formats[396] = {
	mimeType: 'video/mp4; codecs="av01.0.01M.08"',
	qualityLabel: '360p',
	bitrate: 0,
	audioBitrate: null
};

formats[397] = {
	mimeType: 'video/mp4; codecs="av01.0.04M.08"',
	qualityLabel: '480p',
	bitrate: 0,
	audioBitrate: null
};

formats[398] = {
	mimeType: 'video/mp4; codecs="av01.0.05M.08"',
	qualityLabel: '720p',
	bitrate: 0,
	audioBitrate: null
};

formats[399] = {
	mimeType: 'video/mp4; codecs="av01.0.08M.08"',
	qualityLabel: '1080p',
	bitrate: 0,
	audioBitrate: null
};

export default formats;
