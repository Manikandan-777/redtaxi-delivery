export function getTimeOfDayGreeting(
  date: Date = new Date(),
  driverName: string = "Selvam"
): string {
  const hour = date.getHours();
  let timeStr = "Good morning";
  if (hour >= 12 && hour < 17) {
    timeStr = "Good afternoon";
  } else if (hour >= 17) {
    timeStr = "Good evening";
  }
  return `${timeStr}, ${driverName}`;
}
