import { makeCDN } from 'app/multi-media/make-cdn'

export default makeCDN('raw', {
  async uploadImage(url, options) {
    return {
      id: url,
      vendor: 'raw',
    }
  },
  getTransformedImageUrls(url) {
    return {
      '180px': url,
      '400px': url,
      '1200px': url,
      '2500px': url,
      '3840px': url,
    }
  },
})
