export function getExtension(mime: string) {
	let ext = '';
	mime = mime.split(';')[0] as string;

	switch (mime) {
		case 'audio/mpeg':
			ext = 'mp3';
			break;

		case 'audio/mp4':
			ext = 'm4a';
			break;

		case 'audio/webm':
			ext = 'weba';
			break;

		case 'video/3gpp':
			ext = '3gp';
			break;

		case 'video/mp4':
			ext = 'mp4';
			break;

		case 'video/x-flv':
			ext = 'flv';
			break;

		case 'video/webm':
			ext = 'webm';
			break;
	}

	return ext;
}

export function getContainer(mime: string) {
	let container = '';
	mime = mime.split(';')[0] as string;

	switch (mime) {
		case 'audio/mpeg':
			container = 'mp3';
			break;

		case 'audio/m4a':
		case 'audio/mp4':
			container = 'm4a';
			break;

		case 'video/3gpp':
			container = '3gp';
			break;

		case 'video/mp4':
			container = 'mp4';
			break;

		case 'video/x-flv':
			container = 'flv';
			break;

		case 'video/webm':
		case 'audio/webm':
			container = 'webm';
			break;
	}

	return container;
}
