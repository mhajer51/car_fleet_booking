import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';

/**
 * A thin wrapper around the default MUI X Charts tooltip that applies
 * consistent styling with the rest of the dashboard cards.
 */
export default function CustomChartTooltip(props) {
    return (
        <ChartsTooltip
            {...props}
            slotProps={{
                paper: {
                    elevation: 0,
                    sx: {
                        borderRadius: 2,
                        bgcolor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        px: 2,
                        py: 1.5,
                        fontSize: 14,
                    },
                },
            }}
        />
    );
}
