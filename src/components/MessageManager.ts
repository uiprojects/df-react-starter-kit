// src/components/MessageManager.ts
export class MessageManager {
  public toggle = false;
  public message = '';
 
  public showError(msg: string): void {
    this.toggle = true;
    this.message = msg;
  }
 
  public showSuccessMessage(msg: string): void {
    this.toggle = true;
    this.message = msg;
  }
 
  public hideAlerts(): void {
    this.toggle = false;
    this.message = '';
  }
}
 