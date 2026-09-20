export function formatGen(weiValue: string | bigint | number): string {
  try {
    const b = typeof weiValue === "bigint" ? weiValue : BigInt(weiValue.toString());
    const ether = Number(b) / 1e18;
    return ether.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  } catch {
    return "0.00";
  }
}

export function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatTimeRemaining(deadlineIso: string): string {
  try {
    const diff = new Date(deadlineIso).getTime() - Date.now();
    if (diff <= 0) return "Deadline Reached";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  } catch {
    return "Pending";
  }
}
