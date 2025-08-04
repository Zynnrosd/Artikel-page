import root from './root.js';
import auth from './auth.js';
import users from './users.js';
import notification from './notification.js';
import _package from './package.js';
import order from './order.js';
import _class from './class.js';
import schedule from './schedule.js';
import docs from './docs.js';
import attendance from './attendance.js';
import tutorApplication from './tutorApplication.js';
import salary from './salary.js';
import article from './article.js';

export default (app) => {
    root(app);
    auth(app);
    users(app);
    notification(app);
    _package(app);
    order(app);
    _class(app);
    schedule(app);
    docs(app);
    attendance(app);
    tutorApplication(app);
    salary(app);
    app.use('/', article);
  };