export async function prepareLogo(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG or WebP image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('This image could not be read.');
    const scale = Math.min(640 / image.naturalWidth, 320 / image.naturalHeight, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.8, 0.65, 0.5, 0.35]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= 65559) return result;
    }
    throw new Error('This image is too detailed. Choose a simpler or smaller logo.');
  } catch (error) {
    throw new Error(error.name === 'EncodingError' ? 'This image could not be read. Choose another logo.' : error.message);
  } finally { URL.revokeObjectURL(source); }
}
