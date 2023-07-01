const tasksRoutes = require('./tasks');

const appRouter = (app) => {

    // default route
    app.get('/', (req, res) => {
        res.send('Default index');
    });

    // other routes
    tasksRoutes(app);

    app.get('*', function(req, res) {
        res.status(404).send({error: 'Route not available'});
        return;
      });
};

module.exports = appRouter;