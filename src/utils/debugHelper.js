// src/utils/debugHelper.js
export default class DebugHelper {
  /**
   * Print registered routes from a router instance
   * @param {Router} router - Router instance
   */
  static logRoutes(router) {
    console.group('Registered Routes:');

    console.log(
      'Default route (/):',
      router.defaultHandler ? 'Registered' : 'Not registered'
    );
    console.log(
      'Wildcard route (*):',
      router.wildcardHandler ? 'Registered' : 'Not registered'
    );

    console.log('Specific routes:');
    router.routes.forEach((handler, path) => {
      console.log(`- ${path}: Registered`);
    });

    console.groupEnd();
  }

  /**
   * Debug navigation - to be called inside handleNavigation
   * @param {string} path - Current path
   * @param {Router} router - Router instance
   */
  static logNavigation(path, router) {
    console.group(`Navigation to: ${path}`);

    console.log('Has specific handler:', router.routes.has(path));
    console.log('Has default handler:', !!router.defaultHandler);
    console.log('Has wildcard handler:', !!router.wildcardHandler);

    let handlerType = 'none';
    if (router.routes.has(path)) handlerType = 'specific';
    else if (path === '/' && router.defaultHandler) handlerType = 'default';
    else if (router.wildcardHandler) handlerType = 'wildcard';

    console.log('Handler to be used:', handlerType);
    console.groupEnd();
  }
}
