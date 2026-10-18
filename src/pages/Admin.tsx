import { Helmet } from 'react-helmet-async'

export default function Admin() {
  return (
    <>
      <Helmet><title>Admin · Carelle</title></Helmet>
      <h1>Admin</h1>
      <p>Interface d'administration — accès restreint.</p>
    </>
  )
}
