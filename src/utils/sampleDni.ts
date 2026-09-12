/**
 * Generates an in-memory sample Argentine DNI tarjeta for testing & demonstration
 */
export function generateSampleDniImage(): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // ISO 7810 ID-1 standard resolution scaled up for sharpness
    canvas.width = 1000;
    canvas.height = 630;
    const ctx = canvas.getContext('2d')!;

    // Background: Gradient with subtle Argentina colors
    const bgGrad = ctx.createLinearGradient(0, 0, 1000, 630);
    bgGrad.addColorStop(0, '#e0f2fe'); // light sky blue
    bgGrad.addColorStop(0.3, '#f8fafc'); // white center
    bgGrad.addColorStop(0.7, '#f8fafc');
    bgGrad.addColorStop(1, '#bae6fd'); // light sky blue
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1000, 630);

    // Card border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 992, 622);

    // Header Banner
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 1000, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('REPÚBLICA ARGENTINA', 60, 42);

    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText('DOCUMENTO NACIONAL DE IDENTIDAD', 550, 42);

    // Sol de mayo symbol
    ctx.beginPath();
    ctx.arc(32, 35, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Photo Box (Left)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(40, 100, 240, 310);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 100, 240, 310);

    // Silhouette in photo
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(160, 210, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(160, 340, 80, 60, 0, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FOTO ROSTRO', 160, 390);
    ctx.textAlign = 'left';

    // Personal Data Fields
    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('APELLIDO / SURNAME', 320, 125);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('MUESTRA EJEMPLO', 320, 150);

    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('NOMBRES / FORENAMES', 320, 190);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('JUAN AGUSTÍN', 320, 215);

    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('DOCUMENTO ÚNICO / DNI', 320, 255);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('38.452.910', 320, 285);

    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('NACIONALIDAD / NATIONALITY', 320, 325);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('ARGENTINA', 320, 345);

    // SENSITIVE ZONE 1: NÚMERO DE TRÁMITE
    ctx.fillStyle = '#dc2626'; // Alert color highlighting the sensitive field
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('N° TRÁMITE / OF. IDENT. [DATO SENSIBLE]', 320, 485);
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('00481928472', 320, 520);

    // SENSITIVE ZONE 2: FIRMA DIGITALIZADA
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('FIRMA TITULAR [DATO SENSIBLE]', 600, 410);
    
    // Squiggly signature simulation
    ctx.beginPath();
    ctx.moveTo(600, 460);
    ctx.bezierCurveTo(640, 420, 680, 510, 720, 440);
    ctx.bezierCurveTo(750, 410, 780, 500, 840, 450);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Footer notice
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 12px system-ui, sans-serif';
    ctx.fillText('DOCUMENTO DE PRUEBA GENERADO PARA VALIDACIÓN DE PASADNI', 40, 600);

    const img = new Image();
    img.onload = () => resolve(img);
    img.src = canvas.toDataURL('image/png');
  });
}
