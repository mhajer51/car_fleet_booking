import PropTypes from 'prop-types';
import { Alert, Slide, Snackbar } from '@mui/material';

const SlideUp = (props) => <Slide {...props} direction="up" />;

const NotificationSnackbar = ({ open, onClose, message, severity = 'info', autoHideDuration = 5000 }) => (
    <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={SlideUp}
    >
        <Alert
            onClose={onClose}
            severity={severity}
            variant="filled"
            elevation={6}
            sx={{ borderRadius: 2, minWidth: { xs: '100%', sm: 360 } }}
        >
            {message}
        </Alert>
    </Snackbar>
);

NotificationSnackbar.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    message: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(['success', 'info', 'warning', 'error']),
    autoHideDuration: PropTypes.number,
};

export default NotificationSnackbar;
