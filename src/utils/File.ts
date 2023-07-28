import pdf from '../assets/fileImages/file-pdf-solid-240.png'
import png from '../assets/fileImages/file-png-solid-240.png'
import unknown from '../assets/fileImages/file-blank-solid-240.png'

const imageLinks ={
    pdf,
    png,
    unknown
}
const MapType = new Map()
MapType.set('pdf', pdf)
MapType.set('png', png)
MapType.set('unknown', unknown)
export   {MapType}
export  default imageLinks