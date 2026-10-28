export default [
  {
    method: 'GET',
    path: '/content-types',
    handler: 'settingsController.getContentTypes',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/settings',
    handler: 'settingsController.getSettings',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/settings',
    handler: 'settingsController.updateSettings',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/:id',
    handler: 'redirectsController.findOne',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/',
    handler: 'redirectsController.findAll',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/',
    handler: 'redirectsController.create',
    config: {
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/:id',
    handler: 'redirectsController.update',
    config: {
      policies: [],
    },
  },
  {
    method: 'DELETE',
    path: '/:documentId',
    handler: 'redirectsController.delete',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/import',
    handler: 'redirectsController.import',
    config: {
      policies: [],
    },
  },
];
