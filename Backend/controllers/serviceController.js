import Service from '../models/Service.js'
export const GetAllServices = async (req,res) => {
    try {
        const Services = await Service.find()

        if(Services.length === 0) {
            return res.status(404).json({msg : "No services yet"})
        }
        return res.status(200).json({Services})
    }
    catch(err) {
        return res.status(500).json({errName : err.name , errMessage : err.message})
    }
}