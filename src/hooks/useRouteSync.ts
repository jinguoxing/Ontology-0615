import {useEffect, useRef} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useUiStore} from '../store/uiStore';
import {locationToView, viewToLocation} from '../lib/routeMap';
import {isOntologyUrl} from '../api/ontology-v1/routeContext';
import {SEMOVIX_SHELL_OWNED_PATHS} from '../ontology/SemovixShell';

/**
 * Bidirectional bridge between the URL (react-router) and the UI store.
 *
 * Design: the last writer wins, and each direction ignores the change it just
 * caused. We track the location we last pushed to the URL so the store→URL
 * effect doesn't re-fire on the resulting location change, and we track whether
 * the store is mid-external-apply so URL→store doesn't echo back.
 *
 * - store -> URL: when activeView/selectedObjectId change (user clicked nav),
 *   push the corresponding location.
 * - URL -> store: when the location changes from outside (back/forward, deep
 *   link, refresh), write it back to the store so the rendered view matches.
 *
 * On first mount the URL wins (deep link / refresh). The store->URL effect is
 * suppressed until it has observed the initial location.
 *
 * Batch 2 起，/business-semantics/* 本体路由由 ModelContext（URL 即领域上下文）
 * 管理，本桥接在两个方向上对其保持惰性：URL→store 不回写、store→URL 不推跳，
 * 避免遗留 store 状态把用户带离本体空间。
 */
export function useRouteSync() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeView = useUiStore((s) => s.activeView);
  const selectedObjectId = useUiStore((s) => s.selectedObjectId);

  // Has the store->URL effect seen the initial render yet?
  const initialized = useRef(false);
  // The location (path+search) we most recently pushed, to ignore its echo.
  const lastPushed = useRef<string | null>(null);
  // True while applying an external URL change into the store (suppress echo).
  const applyingExternal = useRef(false);

  // URL -> store (runs first per mount; effects run in declaration order)
  useEffect(() => {
    // 本体路由不回写遗留 store（其 activeView 与本体 URL 无对应关系）。
    // 外壳原生规划路由（未实现模块 / 业务语义未实现子能力）同样不回写：
    // 这些路径由 App 直接渲染占位页，折算成遗留视图会把用户带离当前模块。
    if (isOntologyUrl(location.pathname) || SEMOVIX_SHELL_OWNED_PATHS.has(location.pathname)) {
      lastPushed.current = location.pathname + location.search;
      return;
    }
    if (applyingExternal.current) {
      applyingExternal.current = false;
      return;
    }
    // If this location change is the echo of our own push, ignore it.
    const here = location.pathname + location.search;
    if (lastPushed.current === here) {
      return;
    }
    const {view, objectId} = locationToView(location.pathname, location.search);
    const state = useUiStore.getState();
    const viewChanged = state.activeView !== view;
    const objChanged = objectId !== undefined && state.selectedObjectId !== objectId;
    if (viewChanged || objChanged) {
      applyingExternal.current = true;
      state.navigate(view, objectId);
    }
  }, [location.pathname, location.search]);

  // store -> URL
  useEffect(() => {
    // On the first run, defer to the URL (already applied above) — don't clobber
    // a deep link with the store's default activeView.
    if (!initialized.current) {
      initialized.current = true;
      // Still record what the URL currently is so we don't echo it.
      lastPushed.current = location.pathname + location.search;
      return;
    }
    // 位于本体空间或外壳规划路由时，不把遗留 store 视图推到 URL
    // （否则会把 /tasks 等规划路径覆盖成知识网络）。
    if (isOntologyUrl(location.pathname) || SEMOVIX_SHELL_OWNED_PATHS.has(location.pathname)) {
      lastPushed.current = location.pathname + location.search;
      return;
    }
    const target = viewToLocation(activeView, selectedObjectId);
    const targetLoc = target.pathname + target.search;
    const currentLoc = location.pathname + location.search;
    if (targetLoc !== currentLoc) {
      lastPushed.current = targetLoc;
      navigate(targetLoc, {replace: false});
    }
  }, [activeView, selectedObjectId, navigate, location.pathname, location.search]);
}
