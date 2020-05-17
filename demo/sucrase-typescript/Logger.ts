export class Logger {
  private name: string;
  protected messageCount = 0;

  constructor(name: string) {
    this.name = name;
  }

  logMessage(message) {
    this.messageCount += 1;
    const loggedMessage = `[${this.name}]: ${message}`;
    console.log(loggedMessage);
    return loggedMessage;
  }
}
