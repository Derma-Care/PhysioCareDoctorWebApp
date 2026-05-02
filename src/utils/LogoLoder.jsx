import logo from '../assets/images/ic_launcher.png'
import { motion } from 'framer-motion'
export const LogoLoader = () => {
    return (
        <div className="vh-100 d-flex justify-content-center align-items-center">
            <motion.img
                src={logo}
                alt="logo"
                style={{ width: 90 }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.6, 1],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 1,
                }}
            />
        </div>
    )
}
