import { Logger } from './Logger';
import { createMessage } from './createMessage';

const message = createMessage('foo', 'bar');

const logger = new Logger('My Logger');
const loggedMessage = logger.logMessage(message);

(window as any).__sucraseTypescript = loggedMessage === "[My Logger]: message: foo + bar";
