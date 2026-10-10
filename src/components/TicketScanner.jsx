import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ScanLine, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { parseTicketCode } from '@/lib/ticket-values';

const button = 'inline-flex min-h-11 items-center justify-center gap-2 border border-border px-4 py-2 text-sm disabled:opacity-50';

export default function TicketScanner({ eventId, eventTitle, token, onCheckIn }) {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <button type="button" onClick={() => setOpen(true)} className={`${button} border-primary text-primary`}><ScanLine className="h-4 w-4" />Scan ticket</button>
    <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
      <DialogTitle>Ticket check-in</DialogTitle>
      <DialogDescription>{eventTitle}. Scan a ticket QR code to mark its participant as attended automatically.</DialogDescription>
      {open && <ScannerSession key={eventId} eventId={eventId} token={token} onCheckIn={onCheckIn} />}
    </DialogContent>
  </Dialog>;
}

function ScannerSession({ eventId, token, onCheckIn }) {
  const video = useRef(null);
  const stream = useRef(null);
  const timer = useRef(null);
  const generation = useRef(0);
  const active = useRef(true);
  const paused = useRef(false);
  const inFlight = useRef(false);
  const request = useRef(null);
  const onCheckedIn = useRef(onCheckIn);
  onCheckedIn.current = onCheckIn;
  const [camera, setCamera] = useState('off');
  const [cameraError, setCameraError] = useState('');
  const [code, setCode] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const stopCamera = useCallback(() => {
    generation.current++;
    clearTimeout(timer.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    if (active.current) setCamera('off');
  }, []);

  useEffect(() => {
    active.current = true;
    const onHidden = () => { if (document.hidden) stopCamera(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => { active.current = false; stopCamera(); request.current?.abort(); document.removeEventListener('visibilitychange', onHidden); };
  }, [stopCamera]);

  const checkIn = useCallback(async (value) => {
    if (inFlight.current) return;
    paused.current = true;
    setError(''); setResult(null);
    const ticketCode = parseTicketCode(value);
    if (!ticketCode) { setError('This is not a valid YKCircle ticket. Scan its ticket QR code or enter the YK- ticket code.'); return; }
    inFlight.current = true; setWorking(true);
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await apiFetch(`/api/events/${eventId}/tickets/check-in`, {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ticketCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to check in this ticket. Please try again.');
      if (!active.current) return;
      setResult(data); setCode('');
      onCheckedIn.current(data);
    } catch (requestError) {
      if (active.current && requestError.name !== 'AbortError') setError(requestError.message || 'Unable to check in this ticket. Please try again.');
    } finally { inFlight.current = false; if (active.current) setWorking(false); }
  }, [eventId, token]);

  const startCamera = async () => {
    stopCamera(); setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError('Camera scanning requires HTTPS and a browser with camera access. You can enter the ticket code below.'); return; }
    const current = generation.current;
    setCamera('starting');
    try {
      const { default: decode } = await import('jsqr');
      if (!active.current || current !== generation.current) return;
      const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (!active.current || current !== generation.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media;
      video.current.srcObject = media;
      await video.current.play();
      if (!active.current || current !== generation.current) return;
      setCamera('on');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Unable to read the camera image. Enter the ticket code below.');
      const scan = () => {
        if (!active.current || current !== generation.current) return;
        try {
          const frame = video.current;
          if (!paused.current && !inFlight.current && frame?.readyState >= 2 && frame.videoWidth) {
            const scale = Math.min(1, 800 / frame.videoWidth);
            canvas.width = Math.round(frame.videoWidth * scale); canvas.height = Math.round(frame.videoHeight * scale);
            context.drawImage(frame, 0, 0, canvas.width, canvas.height);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            const decoded = decode(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'dontInvert' });
            if (decoded?.data) checkIn(decoded.data);
          }
          timer.current = setTimeout(scan, 180);
        } catch { stopCamera(); setCameraError('Unable to read the camera. Try starting it again, or enter the ticket code below.'); }
      };
      scan();
    } catch (cameraIssue) {
      if (!active.current || current !== generation.current) return;
      stopCamera();
      setCameraError(cameraIssue.name === 'NotAllowedError' ? 'Camera access was denied. Allow camera access in your browser, or enter the ticket code below.' : cameraIssue.name === 'NotFoundError' ? 'No camera was found. Enter the ticket code below.' : 'Unable to start the camera. Check that it is available, or enter the ticket code below.');
    }
  };

  const nextTicket = () => { paused.current = false; setResult(null); setError(''); setCode(''); };
  return <div className="space-y-4">
    <div className={`relative overflow-hidden border border-border bg-black ${camera === 'off' ? 'hidden' : ''}`}>
      <video ref={video} muted playsInline aria-label="Ticket QR camera preview" className="aspect-[4/3] w-full object-cover" />
      <p className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-center text-sm text-white">{working ? 'Checking ticket…' : result || error ? 'Paused — choose Scan next ticket to continue' : 'Hold the ticket QR code inside the camera view'}</p>
    </div>
    <div className="flex flex-wrap gap-3">{camera === 'off' ? <button type="button" onClick={startCamera} className={button}><Camera className="h-4 w-4" />Start camera</button> : <button type="button" onClick={stopCamera} className={button}>{camera === 'starting' ? 'Cancel camera' : 'Stop camera'}</button>}</div>
    {cameraError && <p role="alert" className="text-sm text-muted-foreground">{cameraError}</p>}
    {working && <p role="status" className="text-sm text-muted-foreground">Checking ticket and saving attendance…</p>}
    {result && <div role="status" className={`rounded-2xl border p-4 ${result.alreadyCheckedIn ? 'border-amber-600 bg-amber-500/10' : 'border-green-600 bg-green-500/10'}`}>
      <p className="flex items-center gap-2 font-semibold">{result.alreadyCheckedIn ? <AlertCircle className="h-5 w-5 text-amber-700" /> : <CheckCircle2 className="h-5 w-5 text-green-700" />}{result.alreadyCheckedIn ? 'Already checked in' : 'Checked in — attended'}</p>
      <p className="mt-2 font-medium">{result.participant?.name || 'Ticket holder'}</p>
      <p className="mt-1 text-sm text-muted-foreground">{result.alreadyCheckedIn ? 'This ticket has already been used. Do not admit it again.' : 'This ticket’s participant is now marked as attended.'}</p>
      {result.testMode && <p className="mt-2 text-sm font-semibold text-amber-700">Test ticket</p>}
    </div>}
    {error && <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {(result || error) && <button type="button" onClick={nextTicket} disabled={working} className={`${button} border-primary bg-primary text-primary-foreground`}><ScanLine className="h-4 w-4" />Scan next ticket</button>}
    <form className="border-t border-border pt-4" onSubmit={(event) => { event.preventDefault(); checkIn(code); }}>
      <label htmlFor="ticket-check-in-code" className="text-sm font-medium">Enter or paste ticket code</label>
      <input id="ticket-check-in-code" required disabled={working} value={code} onChange={(event) => setCode(event.target.value)} maxLength={2048} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="YK-… or ticket QR link" className="mt-2 min-h-11 w-full border border-border bg-background px-3 text-sm" />
      <button disabled={working || !code.trim()} className={`${button} mt-3`}>{working ? 'Checking…' : 'Check in ticket'}</button>
    </form>
  </div>;
}
