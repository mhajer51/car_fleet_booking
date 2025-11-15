import { Chip, Divider, Paper, Stack, Typography } from '@mui/material';

const TokenPreview = ({ title, payload }) => (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={600}>
                    {title}
                </Typography>
                <Chip color="success" size="small" label="JWT" />
            </Stack>
            <Divider />
            <Typography component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {JSON.stringify(payload, null, 2)}
            </Typography>
        </Stack>
    </Paper>
);

export default TokenPreview;
