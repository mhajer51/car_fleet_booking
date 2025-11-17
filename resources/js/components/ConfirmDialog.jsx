import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    SvgIcon,
    Typography,
} from '@mui/material';

const WarningIcon = (props) => (
    <SvgIcon {...props} viewBox="0 0 24 24">
        <path d="M1 21h22L12 2z" />
        <path d="M13 16h-2v2h2zm0-6h-2v4h2z" />
    </SvgIcon>
);

const ConfirmDialog = ({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onCancel,
    onConfirm,
    loading = false,
    tone = 'error',
}) => (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
        <DialogTitle>
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                    sx={{
                        backgroundColor: tone === 'error' ? 'rgba(239,68,68,.1)' : 'rgba(59,130,246,.12)',
                        color: tone === 'error' ? '#b91c1c' : '#1d4ed8',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        p: 1,
                    }}
                >
                    <WarningIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography component="span" fontWeight={700} fontSize={16}>
                    {title}
                </Typography>
            </Stack>
        </DialogTitle>
        <DialogContent>
            <Typography color="text.secondary" fontSize={14} lineHeight={1.6}>
                {description}
            </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onCancel} disabled={loading}>
                {cancelLabel}
            </Button>
            <Button
                variant="contained"
                color={tone === 'error' ? 'error' : 'primary'}
                onClick={onConfirm}
                disabled={loading}
            >
                {loading ? 'Working…' : confirmLabel}
            </Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmDialog;
