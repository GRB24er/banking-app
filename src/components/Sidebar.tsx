import React from 'react'
import styles from './Sidebar.module.css'
import {
  HomeIcon,
  BanknotesIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'

export const Sidebar: React.FC = () => (
  <nav className={styles.sidebar}>
    <div className={styles.logo}>Horizon</div>
    <div className={styles.search}>
      <input type="text" placeholder="Search" />
    </div>
    <ul className={styles.menu}>
      <li className={styles.active}><HomeIcon /><span>Home</span></li>
      <li><BanknotesIcon /><span>My Banks</span></li>
      <li><ClockIcon /><span>Transaction History</span></li>
      <li><ArrowRightOnRectangleIcon /><span>Payment Transfer</span></li>
      <li><PlusCircleIcon /><span>Connect Bank</span></li>
    </ul>
  </nav>
)
