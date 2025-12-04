interface OrnateButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const OrnateButton: React.FC<OrnateButtonProps> = ({ children, onClick, type = 'button' }) => {
  return (
    <div className="flex justify-center">
      <button className="ornate-button" onClick={onClick} type={type}>
        <div className="ornate-button-corner left"></div>
        <div className="ornate-button-corner right"></div>
        {children}
      </button>
    </div>
  );
};

export default OrnateButton;

