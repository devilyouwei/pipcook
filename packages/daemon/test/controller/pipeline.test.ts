import { app, assert } from 'midway-mock/bootstrap';
import { readJson } from 'fs-extra';
import { join } from 'path';
import { provide, init } from 'midway';
import { MockCosta } from '../mock/mock-costa';

@provide('pluginRT')
class MockPluginRT {
  costa: MockCosta;
  @init()
  async connect(): Promise<void> {
    this.costa = new MockCosta();
  }
}
describe('test pipeline controller', async () => {
  const pipelineConfig = await readJson(join(__dirname, '../../../../example/pipelines/text-bayes-classification.json'));
  let pipelineResp: any;
  it('remove all pipelines', () => {
    // 用同样的 id 替换真的 service，后续逻辑和其他测试相同
    app.applicationContext.bindClass(MockPluginRT);
    return app
      .httpRequest()
      .del('/api/pipeline')
      .expect(204);
  });
  it('should list all pipelines', () => {
    return app
      .httpRequest()
      .get('/api/pipeline')
      .expect('Content-Type', /json/)
      .expect(200);
  });
  it('should get a nonexistent pipeline', () => {
    return app
      .httpRequest()
      .get('/api/pipeline/nonexistent-id')
      .expect('Content-Type', /json/)
      .expect(404);
  });
  it('should create a pipeline', () => {
    const name = 'pipeline-name';
    return app
      .httpRequest()
      .post('/api/pipeline').send({ config: pipelineConfig, name })
      .expect('Content-Type', /json/)
      .expect(201).then((resp) => {
        pipelineResp = resp.body;
        assert.equal(resp.body.name, name);
        assert.equal(resp.body.dataCollect, pipelineConfig.plugins.dataCollect.package);
        assert.equal(resp.body.dataCollectParams, JSON.stringify(pipelineConfig.plugins.dataCollect.params ?? {}));
        assert.equal(resp.body.dataAccess, pipelineConfig.plugins.dataAccess.package);
        assert.equal(resp.body.dataAccessParams, JSON.stringify(pipelineConfig.plugins.dataAccess.params ?? {}));
        assert.equal(resp.body.modelDefine, pipelineConfig.plugins.modelDefine.package);
        assert.equal(resp.body.modelDefineParams, JSON.stringify(pipelineConfig.plugins.modelDefine.params ?? {}));
        assert.equal(resp.body.modelEvaluate, pipelineConfig.plugins.modelEvaluate.package);
        assert.equal(resp.body.modelEvaluateParams, JSON.stringify(pipelineConfig.plugins.modelEvaluate.params ?? {}));
      });
  });
  it('should install a pipeline', () => {
    return app
      .httpRequest()
      .post(`/api/pipeline/${pipelineResp.id}/installation`)
      .expect('Content-Type', /json/)
      .expect(200).then((resp) => {
        console.log(resp.body);
      });
  });
  it('should create a pipeline by invalid parameters', () => {
    return app
      .httpRequest()
      .post('/api/pipeline').send({})
      .expect('Content-Type', /json/)
      .expect(400);
  });
  it('should update a pipeline', () => {
    console.log(pipelineResp);
    pipelineConfig.name = 'new-name';
    pipelineConfig.plugins.dataCollect.package = 'new-plugin';
    return app.httpRequest()
      .put(`/api/pipeline/${pipelineResp.id}`).send({ config: pipelineConfig })
      .expect('Content-Type', /json/)
      .expect(200).then((resp) => {
        assert.equal(resp.body.name, pipelineConfig.name);
        assert.equal(resp.body.dataCollect, pipelineConfig.plugins.dataCollect.package);
        assert.equal(resp.body.dataCollectParams, JSON.stringify(pipelineConfig.plugins.dataCollect.params ?? {}));
        assert.equal(resp.body.dataAccess, pipelineConfig.plugins.dataAccess.package);
        assert.equal(resp.body.dataAccessParams, JSON.stringify(pipelineConfig.plugins.dataAccess.params ?? {}));
        assert.equal(resp.body.modelDefine, pipelineConfig.plugins.modelDefine.package);
        assert.equal(resp.body.modelDefineParams, JSON.stringify(pipelineConfig.plugins.modelDefine.params ?? {}));
        assert.equal(resp.body.modelEvaluate, pipelineConfig.plugins.modelEvaluate.package);
        assert.equal(resp.body.modelEvaluateParams, JSON.stringify(pipelineConfig.plugins.modelEvaluate.params ?? {}));
      });
  });
  it('trace', () => {
    return app
      .httpRequest()
      .del('/api/pipeline/trace/invalid-trace-id')
      .expect(404);
  });
  it('clear', () => {
    return app
      .httpRequest()
      .del('/api/pipeline')
      .expect(204);
  });
});
