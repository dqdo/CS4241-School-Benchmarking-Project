import { Request, Response, NextFunction } from "express";
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (req.oidc.isAuthenticated()) {
        next();
    } else {
        res.redirect("/login");
    }
}
const ROLE_NAMESPACE = "http://localhost/roles";
export const requireAdmin = (req: any, res: Response, next: NextFunction) => {
    if (!req.oidc.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const roles: string[] = req.oidc.user[ROLE_NAMESPACE] || [];
    if (!roles.includes("Admin")) {
        return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    next();
};

