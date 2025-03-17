import jwt from "jsonwebtoken";
import Debugger from "../utils/debugger.js";
import { generateView } from "../generator.js";

const hasRequiredPermissions = (userPermissions, requiredPermissions) => {
    if(requiredPermissions.length === 0 || userPermissions.length === 0) return true;
    const userPermissionsSet = new Set(userPermissions);
    return requiredPermissions.every(permission => userPermissionsSet.has(permission));
};

export function permissionMiddleware(requiredPermissions, isWeb = true) {
    return async (req, res, next) => {

        res.isWeb = isWeb;

        try {
            
            const userPermissions = res.user_data.permissions;

            if (hasRequiredPermissions(userPermissions, requiredPermissions)) {
                return next();
            }
            else {
                if(isWeb)
                {
                    return generateView({
                        page: "http/error", layout: "basic", title: "Unauthorized",data: {
                            message: `Forbidden: You do not have the necessary permissions. for "${req.originalUrl}"`
                        }
                    },res)
                }
                else {
                    return res.status(403).json({ message: 'Forbidden: You do not have the necessary permissions.' });
                }
               
            }
        }
        catch (error) {
            return Debugger.throw(res, "permissionMiddleware.js", "permissionMiddleware", error)
        }


    }
}


