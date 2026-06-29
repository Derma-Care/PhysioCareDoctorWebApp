import { AppContent, AppSidebar, AppFooter, AppHeader, FCMNotificationHandler } from '../components/index'

const DefaultLayout = () => {
  return (
    <div>
      <FCMNotificationHandler />
      <AppSidebar />
      <div className="wrapper d-flex flex-column  ">
        <AppHeader />
        <div className="body flex-grow-1">
          <AppContent />
        </div>
        {/* <AppFooter /> */}
      </div>
    </div>
  )
}

export default DefaultLayout
