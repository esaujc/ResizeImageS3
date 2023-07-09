const tasksRoutes = require('./tasks');

const appRouter = (app) => {

    // default route
    app.get('/', (req, res) => {
        res.send('Default index');
    });

    // Tasks routes
    tasksRoutes(app);

    // Not recognized
    app.get('*', function(req, res) {
        res.status(404).send({error: 'Route not available'});
        return;
      });
};

module.exports = appRouter;