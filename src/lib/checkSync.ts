interface SyncCheckResult {
  uri: string,
  added: boolean,
  removed: boolean,
  reordered: boolean,
}

export default function checkSync(oldUris: string[], newUris: string[]): SyncCheckResult[] {
  
}
