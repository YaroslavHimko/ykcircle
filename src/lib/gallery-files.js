const fileKey = (file) => [file.name, file.size, file.lastModified, file.type].join(":");

export const appendGalleryFiles = (currentFiles = [], addedFiles = []) => {
  const knownFiles = new Set(currentFiles.map(fileKey));

  return [...currentFiles, ...Array.from(addedFiles).filter((file) => {
    const key = fileKey(file);
    if (knownFiles.has(key)) return false;
    knownFiles.add(key);
    return true;
  })];
};
