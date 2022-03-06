import styles from './Dropdown.module.scss';

function Dropdown({
  buttonText, dropdownContent, showDropdown, buttonCallback,
}: {
  buttonText: string, dropdownContent: React.ReactNode, showDropdown: boolean, buttonCallback: () => void
}) {
  return (
    <div className={styles.dropdown}>
      <button type="button" onClick={buttonCallback}>{buttonText}</button>
      {showDropdown && <div className={styles.dropdownContent}>{dropdownContent}</div>}
    </div>
  );
}

export default Dropdown;
