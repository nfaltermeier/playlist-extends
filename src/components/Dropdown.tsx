import styles from './Dropdown.module.scss';

function Dropdown({ dropdownPrompt, dropdownContent }:
{ dropdownPrompt: React.ReactNode, dropdownContent: React.ReactNode }) {
  return (
    <div className={styles.dropdown}>
      <div>{dropdownPrompt}</div>
      <div className={styles.dropdownContent}>{dropdownContent}</div>
    </div>
  );
}

export default Dropdown;
