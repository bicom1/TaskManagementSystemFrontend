import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

async function getCroppedBlob(imageSrc, cropPixels, fileName = 'cropped.jpg') {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const { width, height, x, y } = cropPixels;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

  const mime = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), mime, 0.92)
  );
  if (!blob) throw new Error('Could not crop image');
  return new File([blob], fileName, { type: mime, lastModified: Date.now() });
}

/**
 * Crop an image before attaching it to a chat message.
 */
export function ImageCropModal({ open, imageSrc, fileName, onClose, onCropped }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const file = await getCroppedBlob(
        imageSrc,
        croppedAreaPixels,
        fileName || 'cropped.jpg'
      );
      onCropped?.(file);
      onClose?.();
    } catch {
      /* parent shows toast if needed */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crop image"
      description="Adjust the crop before sending. Images max 10 MB."
      size="lg"
    >
      <div className="space-y-4">
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-ink/90">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="crop-zoom">Zoom</Label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-ink"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !imageSrc}
            onClick={async () => {
              // Use original file without cropping — fetch blob from object URL
              setBusy(true);
              try {
                const res = await fetch(imageSrc);
                const blob = await res.blob();
                const file = new File([blob], fileName || 'image.jpg', {
                  type: blob.type || 'image/jpeg',
                  lastModified: Date.now(),
                });
                onCropped?.(file);
                onClose?.();
              } finally {
                setBusy(false);
              }
            }}
          >
            Use original
          </Button>
          <Button type="button" onClick={handleApply} disabled={busy || !croppedAreaPixels}>
            {busy ? 'Cropping…' : 'Use cropped image'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
