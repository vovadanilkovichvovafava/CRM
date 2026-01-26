import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * SPA Fallback Middleware
 *
 * Handles client-side routing for Next.js static export.
 * When a dynamic route like /contacts/abc123 is accessed directly,
 * this middleware serves the pre-generated placeholder page which
 * then handles the routing client-side.
 */
@Injectable()
export class SpaFallbackMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SpaFallbackMiddleware.name);
  private readonly webStaticPath: string;

  // Dynamic routes with their placeholder paths
  private readonly dynamicRoutes: Array<{
    pattern: RegExp;
    fallbackPath: string;
  }> = [
    {
      // /contacts/:id -> /contacts/_placeholder/
      pattern: /^\/contacts\/([^/]+)\/?$/,
      fallbackPath: '/contacts/_placeholder/index.html',
    },
  ];

  constructor() {
    this.webStaticPath = path.join(__dirname, '..', '..', 'web-static');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Skip API routes and socket.io
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
      return next();
    }

    // Check if the requested file exists
    const requestedPath = path.join(
      this.webStaticPath,
      req.path.endsWith('/') ? `${req.path}index.html` : req.path
    );

    // If file exists, let the static file server handle it
    if (fs.existsSync(requestedPath)) {
      return next();
    }

    // Check if this matches a dynamic route
    for (const route of this.dynamicRoutes) {
      if (route.pattern.test(req.path)) {
        const fallbackFile = path.join(this.webStaticPath, route.fallbackPath);

        if (fs.existsSync(fallbackFile)) {
          this.logger.debug(`SPA fallback: ${req.path} -> ${route.fallbackPath}`);
          return res.sendFile(fallbackFile);
        }
      }
    }

    // Not a dynamic route, continue to next middleware
    next();
  }
}
