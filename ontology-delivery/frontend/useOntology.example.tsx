/** Copy into repository only after supplying its existing auth/context adapter.
 * This is integration guidance, not a second server or UI Source of Truth.
 */
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {createOntologyClient,OntologyApiError} from './ontologyClient';
import {ontologyKeys,type CacheScope} from './queryKeys';
import type {ViewReference,ApplyOperationsRequest} from './types.generated';
type Client=ReturnType<typeof createOntologyClient>;
export function useOntologyView(client:Client,scope:CacheScope,view:ViewReference){
 return useQuery({queryKey:ontologyKeys.view(scope,view),queryFn:({signal})=>client.getView(scope.modelId,view,signal),retry:(n,e)=>!(e instanceof OntologyApiError&&e.status>=400&&e.status<500)&&n<1});
}
export function useSaveOntology(client:Client,scope:CacheScope,onSaved:(revision:number)=>void){
 const qc=useQueryClient();
 return useMutation({
  mutationFn:(x:{changeSetId:string;body:ApplyOperationsRequest;etag:string;idempotencyKey:string})=>client.applyOperations(scope.modelId,x.changeSetId,x.body,x.etag,x.idempotencyKey),
  retry:false,
  onSuccess:async(result)=>{
    // Advance URL revision only after API success; keep unsaved editor text on failure.
    onSaved(result.data.revision);
    await qc.invalidateQueries({queryKey:ontologyKeys.model(scope)});
  },
 });
}
export function useOntologyJob(client:Client,scope:CacheScope,jobId:string){
 return useQuery({queryKey:ontologyKeys.job(scope,jobId),queryFn:({signal})=>client.getJob(scope.modelId,jobId,signal),enabled:!!jobId,refetchInterval:q=>q.state.data?.data.status==='RUNNING'?1000:false});
}
