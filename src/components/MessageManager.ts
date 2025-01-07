// src/components/MessageManager.ts
export class MessageManager {
  private color = '';
  public toggle = false;
  public message = '';
 
  public showError(msg: string): void {
    this.toggle = true;
    this.message = msg;
    this.color = 'red';
  }
 
  public showSuccessMessage(msg: string): void {
    this.toggle = true;
    this.message = msg;
    this.color = 'green';
  }
 
  public hideAlerts(): void {
    this.toggle = false;
    this.message = '';
    this.color = '';
  }
}
 