/**
 * Batch 3 共享的纯计算逻辑（无 React 依赖，页面与冒烟脚本共用同一份实现）。
 *
 * - workflowCompatibility：流程引用的 requiredActionIds 是否全部存在于当前
 *   视图的行动契约集合。缺行动 = 不兼容。
 * - resolveBinding：实现绑定与 Registry 登记实现的对照结果（版本锁定、IO
 *   Contract、副作用清单）。未解析出问题也允许保存草稿（服务端接受），
 *   页面显示“未解决”，正式阻塞留给 Batch 4 的校验任务。
 */
import type {ImplementationBinding, Registry} from '../api/ontology-v1/types.generated';

export interface WorkflowCompatibility {
  ok: boolean;
  missing: string[];
}

export function workflowCompatibility(requiredActionIds: string[], availableActionIds: string[]): WorkflowCompatibility {
  const have = new Set(availableActionIds);
  const missing = requiredActionIds.filter((id) => !have.has(id));
  return {ok: missing.length === 0, missing};
}

export function registryWorkflow(registry: Registry | undefined, workflowId: string): Registry['workflows'][number] | undefined {
  return registry?.workflows.find((w) => w.id === workflowId);
}

export function registryImplementation(registry: Registry | undefined, implementationId: string): Registry['implementations'][number] | undefined {
  return registry?.implementations.find((i) => i.id === implementationId);
}

export interface BindingResolution {
  /** Registry 中存在该 implementationId。 */
  resolved: boolean;
  /** implementationVersionId 与 Registry 登记版本一致（版本已锁定）。 */
  versionLocked: boolean;
  /** input/output contract ref 与 Registry 实现一致。 */
  ioCompatible: boolean;
  /** expectedSideEffects 与 Registry 实现的副作用清单一致。 */
  sideEffectsMatch: boolean;
  /** 人类可读的未解决原因；空数组 = 全部解决。 */
  issues: string[];
  implementation: Registry['implementations'][number] | undefined;
}

export function resolveBinding(binding: ImplementationBinding, registry: Registry | undefined): BindingResolution {
  const impl = registryImplementation(registry, binding.implementationId);
  const resolved = Boolean(impl);
  const versionLocked = Boolean(impl && impl.versionId === binding.implementationVersionId);
  const ioCompatible = Boolean(
    impl && impl.inputContractRef === binding.inputContractRef && impl.outputContractRef === binding.outputContractRef,
  );
  const sideEffectsMatch = Boolean(impl && sameSet(binding.expectedSideEffects, impl.sideEffects));
  const issues: string[] = [];
  if (!impl) {
    issues.push(`Registry 中不存在实现 ${binding.implementationId}（版本未锁定）`);
  } else {
    if (!versionLocked) {
      issues.push(`版本未锁定：绑定 ${binding.implementationVersionId} ≠ Registry 登记 ${impl.versionId}`);
    }
    if (!ioCompatible) {
      issues.push('IO Contract 与 Registry 实现不一致（Batch 4 校验将阻塞发布）');
    }
    if (!sideEffectsMatch) {
      issues.push('副作用清单与 Registry 实现不匹配（Batch 4 校验将阻塞发布）');
    }
  }
  return {resolved, versionLocked, ioCompatible, sideEffectsMatch, issues, implementation: impl};
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const bs = new Set(b);
  return a.every((x) => bs.has(x));
}
