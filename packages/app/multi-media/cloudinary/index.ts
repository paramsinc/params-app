import { serverEnv } from 'app/env/env.server'
import { makeCDN } from 'app/multi-media/make-cdn'
import { v2, UploadApiResponse } from 'cloudinary'

const cloudinaryServer = (() => {
  v2.config({
    cloud_name: serverEnv.CLOUDINARY_CLOUD_NAME,
    api_key: serverEnv.CLOUDINARY_API_KEY,
    api_secret: serverEnv.CLOUDINARY_SECRET,
  })
  return v2
})()

export default makeCDN('cloudinary', {
  async uploadImage(image, options) {
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinaryServer.uploader
        .upload_stream((error, uploadResult) => {
          if (uploadResult) {
            return resolve(uploadResult)
          }
          return reject(error)
        })
        .end(image.arrayBuffer())
    })

    return {
      id: uploadResult.public_id,
      vendor: 'cloudinary',
    }
  },
})
