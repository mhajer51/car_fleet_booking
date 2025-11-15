import { createElement, Fragment, registerRoot, scheduleRender, useEffect, useMemo, useRef, useState } from './react-lite-core.js';

export default {
    createElement,
    Fragment,
    useEffect,
    useMemo,
    useRef,
    useState,
    unstable_scheduleRender: scheduleRender,
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: { registerRoot },
};
