import logo from '../img/logo.png'

const Logo = () => {
    return (
        <div className="brand">
            <img src={logo} alt="" className="brand-logo" />
            <strong className="brand-name">MilliSend</strong>
        </div>
    );
}

export default Logo