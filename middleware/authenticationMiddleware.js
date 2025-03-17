import jwt from "jsonwebtoken";
import Debugger from "../utils/debugger.js";



export const authenticatedAPI = async (req, res, next) => {

    try {
        if(req.headers.hasOwnProperty("cookie"))
        {
            if (req.cookies.hasOwnProperty("token")) {
                try {
                    let verifyToken = jwt.verify(req.cookies.token, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
                    if (verifyToken) {
                        res.user_data = verifyToken;
                        return next();
                    }
                }
                catch(error)
                {
                    console.log("error.message",error.message)
                    return res.generateView({
                        page: "login", layout: "authcontext", data: {
                            errors: error.message == "jwt expired" ? "Session expired, Please login again." : error.message == "jwt malformed"  ? "Invalid Session" : "Please login first."
                        }
                    })
                }
                
            }   
        }

        return res.generateView({
            page: "login", layout: "authcontext", data: {
                errors: "Please login first."
            }
        })


    }
    catch (error) {
        return Debugger.throw(res, "authenticationMiddleware.js", "authenticatedAPI", error)
    }
}
    
    
