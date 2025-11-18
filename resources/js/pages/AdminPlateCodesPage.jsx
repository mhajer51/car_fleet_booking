import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EditOutlinedIcon from '../components/icons/EditOutlinedIcon.jsx';
import DeleteOutlineIcon from '../components/icons/DeleteOutlineIcon.jsx';
import {
    createPlateCategory,
    createPlateCode,
    createPlateSource,
    deletePlateCategory,
    deletePlateCode,
    deletePlateSource,
    fetchPlateCategories,
    fetchPlateCodes,
    fetchPlateSources,
    updatePlateCategory,
    updatePlateCode,
    updatePlateSource,
} from '../services/admin.js';

const emptyForm = { id: null, title: '', plate_source_id: '', plate_category_id: '' };

const SectionHeader = ({ title, action }) => (
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700}>
            {title}
        </Typography>
        {action}
    </Stack>
);

const AdminPlateCodesPage = () => {
    const [sources, setSources] = useState([]);
    const [categories, setCategories] = useState([]);
    const [codes, setCodes] = useState([]);
    const [meta, setMeta] = useState({ total: 0, per_page: 10, current_page: 1 });
    const [filters, setFilters] = useState({ source: '', category: '', search: '' });
    const [searchInput, setSearchInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [formTarget, setFormTarget] = useState('source');
    const [formValues, setFormValues] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteType, setDeleteType] = useState('source');
    const [deleting, setDeleting] = useState(false);

    const loadSources = useCallback(async () => {
        const payload = await fetchPlateSources();
        setSources(payload.sources ?? []);
    }, []);

    const loadCategories = useCallback(async () => {
        const payload = await fetchPlateCategories({ plate_source_id: filters.source || undefined });
        setCategories(payload.categories ?? []);
    }, [filters.source]);

    const loadCodes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await fetchPlateCodes({
                per_page: meta.per_page ?? 10,
                page: meta.current_page ?? 1,
                plate_source_id: filters.source || undefined,
                plate_category_id: filters.category || undefined,
                search: filters.search || undefined,
            });
            setCodes(payload.codes ?? []);
            setMeta((prev) => ({ ...prev, ...(payload.meta ?? {}) }));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters.category, filters.search, filters.source, meta.current_page, meta.per_page]);

    useEffect(() => {
        loadSources();
    }, [loadSources]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setFilters((prev) => ({ ...prev, search: searchInput.trim() }));
        }, 400);
        return () => clearTimeout(handler);
    }, [searchInput]);

    useEffect(() => {
        setMeta((prev) => ({ ...prev, current_page: 1 }));
    }, [filters.category, filters.source, filters.search]);

    useEffect(() => {
        loadCodes();
    }, [loadCodes]);

    const resetForm = () => {
        setFormValues(emptyForm);
        setFormErrors({});
    };

    const openForm = (type, data = null) => {
        setFormTarget(type);
        if (data) {
            setFormValues({
                id: data.id,
                title: data.title,
                plate_source_id: data.source?.id ?? data.plate_source_id ?? '',
                plate_category_id: data.category?.id ?? data.plate_category_id ?? '',
            });
        } else {
            resetForm();
        }
        setFormOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setFormErrors({});
        try {
            if (formTarget === 'source') {
                if (formValues.id) {
                    const payload = await updatePlateSource(formValues.id, { title: formValues.title });
                    setSources((prev) => prev.map((item) => (item.id === formValues.id ? payload.source : item)));
                } else {
                    const payload = await createPlateSource({ title: formValues.title });
                    setSources((prev) => [...prev, payload.source]);
                }
                await loadCategories();
            }

            if (formTarget === 'category') {
                const body = { plate_source_id: formValues.plate_source_id, title: formValues.title };
                if (formValues.id) {
                    const payload = await updatePlateCategory(formValues.id, body);
                    setCategories((prev) => prev.map((item) => (item.id === formValues.id ? payload.category : item)));
                } else {
                    const payload = await createPlateCategory(body);
                    setCategories((prev) => [...prev, payload.category]);
                }
                await loadCodes();
            }

            if (formTarget === 'code') {
                const body = { plate_category_id: formValues.plate_category_id, title: formValues.title };
                if (formValues.id) {
                    const payload = await updatePlateCode(formValues.id, body);
                    setCodes((prev) => prev.map((item) => (item.id === formValues.id ? payload.code : item)));
                } else {
                    const payload = await createPlateCode(body);
                    setCodes((prev) => [payload.code, ...prev]);
                }
                await loadCodes();
            }

            setFormOpen(false);
        } catch (err) {
            const validation = err?.response?.data?.data;
            if (validation) {
                setFormErrors(validation);
            } else {
                setError(err.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            if (deleteType === 'source') {
                await deletePlateSource(deleteTarget.id);
                setSources((prev) => prev.filter((item) => item.id !== deleteTarget.id));
                await loadCategories();
                await loadCodes();
            }
            if (deleteType === 'category') {
                await deletePlateCategory(deleteTarget.id);
                setCategories((prev) => prev.filter((item) => item.id !== deleteTarget.id));
                await loadCodes();
            }
            if (deleteType === 'code') {
                await deletePlateCode(deleteTarget.id);
                setCodes((prev) => prev.filter((item) => item.id !== deleteTarget.id));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const selectedCategories = useMemo(() => {
        if (!filters.source) return categories;
        return categories.filter((category) => category.source?.id === Number(filters.source));
    }, [categories, filters.source]);

    return (
        <AdminLayout
            title="لوحات المركبات"
            description="إدارة مصادر اللوحات والفئات والأكواد المرتبطة بها"
            actions={
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={() => openForm('source')}>إضافة مصدر</Button>
                    <Button variant="outlined" onClick={() => openForm('category')}>إضافة فئة</Button>
                    <Button variant="outlined" onClick={() => openForm('code')}>إضافة كود</Button>
                </Stack>
            }
        >
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <SectionHeader title="المصادر" action={null} />
                            <Stack spacing={1}>
                                {sources.map((source) => (
                                    <Stack
                                        key={source.id}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{ p: 1.2, borderRadius: 1, border: '1px solid #e2e8f0' }}
                                    >
                                        <Typography fontWeight={600}>{source.title}</Typography>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton size="small" onClick={() => openForm('source', source)}>
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setDeleteTarget(source);
                                                    setDeleteType('source');
                                                }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                ))}
                                {sources.length === 0 && (
                                    <Typography color="text.secondary" textAlign="center">
                                        لا توجد مصادر بعد.
                                    </Typography>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <SectionHeader title="الفئات" action={null} />
                            <Stack spacing={1}>
                                {categories.map((category) => (
                                    <Stack
                                        key={category.id}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{ p: 1.2, borderRadius: 1, border: '1px solid #e2e8f0' }}
                                    >
                                        <Box>
                                            <Typography fontWeight={600}>{category.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {category.source?.title}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton size="small" onClick={() => openForm('category', category)}>
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setDeleteTarget(category);
                                                    setDeleteType('category');
                                                }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                ))}
                                {categories.length === 0 && (
                                    <Typography color="text.secondary" textAlign="center">
                                        لا توجد فئات بعد.
                                    </Typography>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <SectionHeader title="الأكواد" action={null} />
                            <Stack spacing={2} mb={2}>
                                <TextField
                                    label="بحث"
                                    size="small"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="ابحث عن الكود"
                                />
                                <TextField
                                    select
                                    size="small"
                                    label="المصدر"
                                    value={filters.source}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFilters((prev) => ({ ...prev, source: value, category: '' }));
                                    }}
                                >
                                    <MenuItem value="">الكل</MenuItem>
                                    {sources.map((source) => (
                                        <MenuItem key={source.id} value={source.id}>
                                            {source.title}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    size="small"
                                    label="الفئة"
                                    value={filters.category}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                                    disabled={selectedCategories.length === 0}
                                >
                                    <MenuItem value="">الكل</MenuItem>
                                    {selectedCategories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.title}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Stack>

                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>الكود</TableCell>
                                        <TableCell>الفئة</TableCell>
                                        <TableCell>المصدر</TableCell>
                                        <TableCell align="right">إجراءات</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {codes.map((code) => (
                                        <TableRow key={code.id} hover>
                                            <TableCell>{code.title}</TableCell>
                                            <TableCell>{code.category?.title}</TableCell>
                                            <TableCell>{code.source?.title}</TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => openForm('code', code)}>
                                                    <EditOutlinedIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => {
                                                        setDeleteTarget(code);
                                                        setDeleteType('code');
                                                    }}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {codes.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                                {loading ? 'جاري التحميل...' : 'لا توجد أكواد بعد.'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <TablePagination
                                component="div"
                                count={meta.total ?? 0}
                                page={(meta.current_page ?? 1) - 1}
                                onPageChange={(_e, page) => setMeta((prev) => ({ ...prev, current_page: page + 1 }))}
                                rowsPerPage={meta.per_page ?? 10}
                                onRowsPerPageChange={(e) =>
                                    setMeta({ ...meta, per_page: parseInt(e.target.value, 10), current_page: 1 })
                                }
                                rowsPerPageOptions={[5, 10, 25, 50]}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>
                    {formTarget === 'source'
                        ? formValues.id
                            ? 'تعديل مصدر'
                            : 'إضافة مصدر'
                        : formTarget === 'category'
                            ? formValues.id
                                ? 'تعديل فئة'
                                : 'إضافة فئة'
                            : formValues.id
                                ? 'تعديل كود'
                                : 'إضافة كود'}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} mt={1}>
                        {(formTarget === 'category' || formTarget === 'code') && (
                            <TextField
                                select
                                label="المصدر"
                                value={formValues.plate_source_id}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormValues((prev) => ({ ...prev, plate_source_id: value, plate_category_id: '' }));
                                }}
                                error={Boolean(formErrors.plate_source_id)}
                                helperText={formErrors.plate_source_id?.[0]}
                            >
                                <MenuItem value="">اختر المصدر</MenuItem>
                                {sources.map((source) => (
                                    <MenuItem key={source.id} value={source.id}>
                                        {source.title}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}

                        {formTarget === 'code' && (
                            <TextField
                                select
                                label="الفئة"
                                value={formValues.plate_category_id}
                                onChange={(e) => setFormValues((prev) => ({ ...prev, plate_category_id: e.target.value }))}
                                error={Boolean(formErrors.plate_category_id)}
                                helperText={formErrors.plate_category_id?.[0]}
                                disabled={!formValues.plate_source_id}
                            >
                                <MenuItem value="">اختر الفئة</MenuItem>
                                {categories
                                    .filter((category) =>
                                        formValues.plate_source_id
                                            ? category.source?.id === Number(formValues.plate_source_id)
                                            : true
                                    )
                                    .map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.title}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        )}

                        <TextField
                            label="العنوان"
                            value={formValues.title}
                            onChange={(e) => setFormValues((prev) => ({ ...prev, title: e.target.value }))}
                            error={Boolean(formErrors.title)}
                            helperText={formErrors.title?.[0]}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFormOpen(false)}>إلغاء</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                        {saving ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="تأكيد الحذف"
                description="سيتم حذف هذا السجل بشكل نهائي."
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleting}
            />
        </AdminLayout>
    );
};

export default AdminPlateCodesPage;
