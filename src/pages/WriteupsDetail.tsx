import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function WriteupsDetail() {
  const { slug } = useParams()

  return (
    <>
      <Helmet><title>{slug} · Write-up · Carelle</title></Helmet>
      <h1>Write-up : {slug}</h1>
      <p>Le contenu de ce write-up sera chargé depuis Supabase.</p>
    </>
  )
}
