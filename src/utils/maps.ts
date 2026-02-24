export function gmap(query: string): string {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
}

export function gmapDir(from: string, to: string, mode: string = 'transit'): string {
  return (
    'https://www.google.com/maps/dir/?api=1&origin=' +
    encodeURIComponent(from) +
    '&destination=' +
    encodeURIComponent(to) +
    '&travelmode=' +
    mode
  );
}
