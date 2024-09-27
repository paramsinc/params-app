import { serverEnv } from 'app/env/env.server'
import { makeCDN } from 'app/multi-media/make-cdn'
import { cdnImageTransformations } from '../cdnImageTransformations'
import { v2, UploadApiResponse } from 'cloudinary'

const cloudinaryServer = (() => {
  v2.config({
    cloud_name: serverEnv.CLOUDINARY_CLOUD_NAME,
    api_key: serverEnv.CLOUDINARY_API_KEY,
    api_secret: serverEnv.CLOUDINARY_SECRET,
  })
  return v2
})()

const stream = (image: File) =>
  new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinaryServer.uploader
      .upload_stream((error, uploadResult) => {
        if (uploadResult) {
          return resolve(uploadResult)
        }
        return reject(error)
      })
      .end(image.arrayBuffer())
  })

export default makeCDN('cloudinary', {
  async uploadImage(base64, options) {
    const upload = await cloudinaryServer.uploader.upload(base64, {
      folder: options?.folder,
      public_id: options?.publicId,
      eager: Object.keys(cdnImageTransformations).map((name) => `t_${name}`),
    })
    return {
      id: upload.public_id,
      vendor: 'cloudinary',
    }
  },
  getTransformedImageUrls(publicId) {
    return {
      '180px': `https://res.cloudinary.com/${serverEnv.CLOUDINARY_CLOUD_NAME}/image/upload/t_180px/${publicId}`,
      '400px': `https://res.cloudinary.com/${serverEnv.CLOUDINARY_CLOUD_NAME}/image/upload/t_400px/${publicId}`,
      '1200px': `https://res.cloudinary.com/${serverEnv.CLOUDINARY_CLOUD_NAME}/image/upload/t_1200px/${publicId}`,
      '2500px': `https://res.cloudinary.com/${serverEnv.CLOUDINARY_CLOUD_NAME}/image/upload/t_2500px/${publicId}`,
      '3840px': `https://res.cloudinary.com/${serverEnv.CLOUDINARY_CLOUD_NAME}/image/upload/t_3840px/${publicId}`,
    }
  },
})
