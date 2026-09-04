import { useEffect, useState } from "react";
import type { IllustratorDetectionResult, IllustratorRunResult } from "../adapters/illustrator/windowsAutomation";
import type { PackageRunResult } from "../core/packageRun";
import type { AiFileEntry, PreparedRun } from "../core/types";
import { formatFileSize, summarizePackageRows } from "./ux";

type BusyMode = "scan" | "test" | "package" | undefined;

function Icon({ name }: { name: "plus" | "folder" | "shield" | "file" | "check" | "warning" | "error" | "chevron" | "info" }) {
  const paths: Record<string, any> = {
    plus: <><path d="M12 5v14M5 12h14" /></>,
    folder: <path d="M3.5 7.5h6l2-2h9v13h-17z" />,
    shield: <path d="M12 3.5 19 6v5.5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6z" />,
    file: <><path d="M7 3.5h7l4 4V20H7z" /><path d="M14 3.5V8h4" /></>,
    check: <path d="m5 12 4 4 10-10" />,
    warning: <><path d="M12 4 3.8 19h16.4z" /><path d="M12 9v4M12 16.5h.01" /></>,
    error: <><circle cx="12" cy="12" r="8.5" /><path d="m9 9 6 6m0-6-6 6" /></>,
    chevron: <path d="m9 7 5 5-5 5" />,
    info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>
  };

  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function basename(targetPath: string): string {
  const parts = targetPath.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? targetPath;
}

function dirname(targetPath: string): string {
  const parts = targetPath.split(/[\\/]/);
  parts.pop();
  return parts.join("\\") || targetPath;
}

export function App() {
  const [inputs, setInputs] = useState<string[]>([]);
  const [outputRoot, setOutputRoot] = useState("");
  const [runName, setRunName] = useState("AI打包文件");
  const [recursive, setRecursive] = useState(true);
  const [since, setSince] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [aiFiles, setAiFiles] = useState<AiFileEntry[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [prepared, setPrepared] = useState<PreparedRun | undefined>();
  const [runResult, setRunResult] = useState<IllustratorRunResult | undefined>();
  const [packageResult, setPackageResult] = useState<PackageRunResult | undefined>();
  const [status, setStatus] = useState("添加 Illustrator 文件或包含 AI 文件的文件夹。");
  const [busyMode, setBusyMode] = useState<BusyMode>();
  const [illustratorStatus, setIllustratorStatus] = useState<IllustratorDetectionResult>({
    status: "unsupported",
    message: "正在检测 Adobe Illustrator…"
  });

  useEffect(() => {
    let cancelled = false;
    void window.aiLinkPackager.detectIllustrator().then((result) => {
      if (!cancelled) setIllustratorStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const busy = Boolean(busyMode);
  const selectedFiles = aiFiles.filter((file) => selectedPaths.has(file.path));
  const summary = packageResult ? summarizePackageRows(packageResult.rows) : undefined;

  function resetRunState(): void {
    setPrepared(undefined);
    setRunResult(undefined);
    setPackageResult(undefined);
  }

  async function chooseAiFiles(): Promise<void> {
    const selected = await window.aiLinkPackager.selectAiFiles();
    if (selected.length > 0) {
      setInputs(selected);
      setAiFiles([]);
      setSelectedPaths(new Set());
      resetRunState();
      setStatus(`已添加 ${selected.length} 个 AI 文件。下一步选择输出位置。`);
    }
  }

  async function chooseInputFolder(): Promise<void> {
    const selected = await window.aiLinkPackager.selectFolder();
    if (selected) {
      setInputs([selected]);
      setAiFiles([]);
      setSelectedPaths(new Set());
      resetRunState();
      setStatus(`已添加文件夹「${basename(selected)}」。下一步选择输出位置。`);
    }
  }

  async function chooseOutputFolder(): Promise<void> {
    const selected = await window.aiLinkPackager.selectFolder();
    if (selected) {
      setOutputRoot(selected);
      setAiFiles([]);
      setSelectedPaths(new Set());
      resetRunState();
      setStatus(inputs.length > 0 ? "输出位置已设置。现在可以扫描 AI 文件。" : "输出位置已设置。请继续添加 AI 文件。" );
    }
  }

  async function runBusy(mode: Exclude<BusyMode, undefined>, action: () => Promise<void>): Promise<void> {
    setBusyMode(mode);
    try {
      await action();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyMode(undefined);
    }
  }

  async function scan(): Promise<void> {
    await runBusy("scan", async () => {
      setStatus("正在扫描 AI 文件…");
      const result = await window.aiLinkPackager.scan({
        inputPaths: inputs,
        recursive,
        since: since || undefined,
        excludePaths: outputRoot ? [outputRoot] : []
      });
      setAiFiles(result);
      setSelectedPaths(new Set(result.map((file) => file.path)));
      resetRunState();
      setStatus(result.length > 0 ? `找到 ${result.length} 个 AI 文件。请确认后开始打包。` : "没有找到符合条件的 AI 文件，请检查输入位置或扫描选项。" );
    });
  }

  async function packageRun(limit?: number): Promise<void> {
    await runBusy(limit === 1 ? "test" : "package", async () => {
      const files = selectedFiles;
      setStatus(limit === 1 ? "正在测试第一个 AI 文件…" : `正在打包 ${files.length} 个 AI 文件…`);
      const effectiveRunName = limit === 1 ? `${runName || "AI打包文件"}-测试` : runName;
      const result = await window.aiLinkPackager.packageRun({ aiFiles: files, outputRoot, limit, runName: effectiveRunName });
      setPrepared(result.prepared);
      setRunResult(result.run);
      setPackageResult(result);
      const counts = summarizePackageRows(result.rows);
      setStatus(`打包完成：${counts.success} 个完整，${counts.partial} 个有缺失素材，${counts.failed} 个失败。`);
      await window.aiLinkPackager.confirmOpenOutputFolder(result.prepared.runRoot);
    });
  }

  function toggleFile(path: string): void {
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
    resetRunState();
  }

  function selectAll(): void {
    setSelectedPaths(new Set(aiFiles.map((file) => file.path)));
    resetRunState();
  }

  function clearSelection(): void {
    setSelectedPaths(new Set());
    resetRunState();
  }

  const canScan = inputs.length > 0 && outputRoot.length > 0 && !busy;
  const canPackage = selectedFiles.length > 0 && outputRoot.length > 0 && !busy;
  const currentStep = packageResult ? 3 : aiFiles.length > 0 ? 3 : outputRoot && inputs.length > 0 ? 2 : inputs.length > 0 ? 2 : 1;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">Ai</div>
          <div>
            <h1>AI Link Packager</h1>
            <p>安全收集 Illustrator 文件及其链接素材</p>
          </div>
        </div>
        <div
          className={`status-pill ${busy ? "is-busy" : ""} ${illustratorStatus.status === "not_detected" ? "is-warning" : ""}`}
          title={illustratorStatus.message}
        >
          <span className="status-dot" />
          {busy ? "处理中" : illustratorStatus.status === "available" ? "Illustrator 已连接" : illustratorStatus.status === "not_detected" ? "未检测到 Illustrator" : "正在检测 Illustrator"}
        </div>
      </header>

      <section className="trust-note">
        <Icon name="shield" />
        <span><strong>原始文件不会被修改。</strong> 软件只会在输出位置创建副本、Links 文件夹和报告。</span>
      </section>

      {illustratorStatus.status === "not_detected" && (
        <section className="illustrator-warning">
          <Icon name="warning" />
          <span><strong>未检测到 Adobe Illustrator。</strong> 请确认 Illustrator 已通过正常安装程序安装。安装在哪个磁盘都可以，程序通过 Windows COM 注册信息查找它。</span>
        </section>
      )}

      <section className="stepper" aria-label="打包流程">
        {["添加文件", "设置输出", "确认并打包"].map((label, index) => {
          const step = index + 1;
          const completed = currentStep > step || packageResult !== undefined;
          const active = currentStep === step && !packageResult;
          return (
            <div className={`step ${completed ? "completed" : ""} ${active ? "active" : ""}`} key={label}>
              <span className="step-number">{completed ? <Icon name="check" /> : step}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </section>

      {busy && (
        <section className="progress-card" aria-live="polite">
          <div className="progress-copy">
            <span className="spinner" />
            <div>
              <h2>{busyMode === "scan" ? "正在查找 Illustrator 文件" : busyMode === "test" ? "正在测试打包" : "正在打包文件"}</h2>
              <p>{busyMode === "scan" ? "正在读取文件信息，请稍候。" : "Illustrator 正在逐个读取真实链接并复制素材，请不要关闭 Illustrator。"}</p>
            </div>
          </div>
          <div className="indeterminate-track"><span /></div>
        </section>
      )}

      {!packageResult && (
        <>
          <section className="source-card panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">STEP 1</span>
                <h2>添加 Illustrator 文件</h2>
                <p>可以直接选择多个 .ai 文件，也可以选择一个包含项目文件的文件夹。</p>
              </div>
              {inputs.length > 0 && <span className="count-badge">{inputs.length} 个来源</span>}
            </div>

            {inputs.length === 0 ? (
              <div className="drop-zone">
                <div className="drop-icon"><Icon name="plus" /></div>
                <h3>添加需要交付的 AI 文件</h3>
                <p>选择单个/多个 AI 文件，或扫描整个项目文件夹</p>
                <div className="drop-actions">
                  <button className="primary" onClick={chooseAiFiles} disabled={busy}><Icon name="file" />选择 AI 文件</button>
                  <button onClick={chooseInputFolder} disabled={busy}><Icon name="folder" />选择文件夹</button>
                </div>
              </div>
            ) : (
              <div className="source-summary">
                <div className="source-icon"><Icon name={inputs.length > 1 || inputs[0].toLowerCase().endsWith(".ai") ? "file" : "folder"} /></div>
                <div className="source-copy">
                  <strong>{inputs.length === 1 ? basename(inputs[0]) : `${inputs.length} 个 AI 文件`}</strong>
                  <span title={inputs.join("；")}>{inputs.length === 1 ? inputs[0] : inputs.join("；")}</span>
                </div>
                <div className="compact-actions">
                  <button className="quiet" onClick={chooseAiFiles} disabled={busy}>重新选文件</button>
                  <button className="quiet" onClick={chooseInputFolder} disabled={busy}>改选文件夹</button>
                </div>
              </div>
            )}
          </section>

          <section className="output-card panel">
            <div className="section-heading compact-heading">
              <div>
                <span className="eyebrow">STEP 2</span>
                <h2>选择输出位置</h2>
                <p>每次运行会自动创建独立打包目录，不会覆盖现有文件。</p>
              </div>
            </div>

            <button className={`path-picker ${outputRoot ? "has-value" : ""}`} onClick={chooseOutputFolder} disabled={busy}>
              <span className="path-icon"><Icon name="folder" /></span>
              <span className="path-copy">
                <strong>{outputRoot ? basename(outputRoot) : "选择输出文件夹"}</strong>
                <small>{outputRoot || "例如：F:\AI_Packaged"}</small>
              </span>
              <span className="path-action">{outputRoot ? "更改" : "选择"}</span>
            </button>

            <label className="folder-name-field">
              <span>
                <strong>新文件夹名称</strong>
                <small>可自行命名；若同名文件夹已存在，会自动添加 _2、_3，不会覆盖。</small>
              </span>
              <input
                type="text"
                value={runName}
                onChange={(event: { target: { value: string } }) => setRunName(event.target.value)}
                placeholder="例如：天下工坊_AI源文件交付"
                disabled={busy}
              />
            </label>

            <div className="advanced-block">
              <button className="advanced-toggle" onClick={() => setAdvancedOpen((value) => !value)} type="button">
                <span className={advancedOpen ? "rotate" : ""}><Icon name="chevron" /></span>
                扫描选项
              </button>
              {advancedOpen && (
                <div className="advanced-options">
                  <label className="check-row">
                    <input type="checkbox" checked={recursive} onChange={(event: { target: { checked: boolean } }) => setRecursive(event.target.checked)} />
                    <span><strong>包含子文件夹</strong><small>扫描所选文件夹下的所有层级</small></span>
                  </label>
                  <label className="date-field">
                    <span><strong>修改时间不早于</strong><small>留空则扫描全部文件</small></span>
                    <input type="date" value={since} onChange={(event: { target: { value: string } }) => setSince(event.target.value)} />
                  </label>
                </div>
              )}
            </div>
          </section>

          {aiFiles.length === 0 ? (
            <section className="primary-action-card">
              <div>
                <h2>准备好后，先检查要打包的文件</h2>
                <p>{inputs.length === 0 ? "请先添加 AI 文件或文件夹。" : !outputRoot ? "还需要选择一个输出位置。" : "软件会扫描 AI 文件并让你在打包前确认列表。"}</p>
              </div>
              <button className="primary large" disabled={!canScan} onClick={scan}>扫描 AI 文件</button>
            </section>
          ) : (
            <section className="files-panel panel">
              <div className="files-toolbar">
                <div>
                  <span className="eyebrow">STEP 3</span>
                  <h2>确认打包文件</h2>
                  <p>已选择 {selectedFiles.length} / {aiFiles.length} 个文件</p>
                </div>
                <div className="toolbar-actions">
                  <button className="quiet" onClick={selectAll} disabled={busy}>全选</button>
                  <button className="quiet" onClick={clearSelection} disabled={busy}>取消选择</button>
                  <button className="quiet" onClick={scan} disabled={!canScan}>重新扫描</button>
                </div>
              </div>

              <div className="file-list">
                {aiFiles.map((file) => {
                  const checked = selectedPaths.has(file.path);
                  return (
                    <label className={`file-row ${checked ? "selected" : ""}`} key={file.path}>
                      <input type="checkbox" checked={checked} onChange={() => toggleFile(file.path)} disabled={busy} />
                      <span className="file-type-icon"><Icon name="file" /></span>
                      <span className="file-main">
                        <strong>{file.name}</strong>
                        <small title={file.path}>{dirname(file.path)}</small>
                      </span>
                      <span className="file-meta">
                        <small>{formatFileSize(file.sizeBytes)}</small>
                        <small>{new Date(file.modifiedAt).toLocaleString()}</small>
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="package-actions">
                <div className="test-callout">
                  <Icon name="info" />
                  <div><strong>第一次使用？</strong><span>可以先测试 1 个文件，确认 Illustrator 调用正常。</span></div>
                  <button className="quiet" disabled={!canPackage} onClick={() => packageRun(1)}>测试第一个文件</button>
                </div>
                <button className="primary hero-action" disabled={!canPackage} onClick={() => packageRun()}>
                  开始打包 {selectedFiles.length} 个文件
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {packageResult && summary && (
        <section className="completion-card panel">
          <div className={`completion-icon ${summary.failed > 0 ? "warning" : "success"}`}>
            <Icon name={summary.failed > 0 ? "warning" : "check"} />
          </div>
          <div className="completion-heading">
            <span className="eyebrow">完成</span>
            <h2>{summary.failed === 0 && summary.partial === 0 ? "全部文件打包完成" : "打包完成，请检查部分项目"}</h2>
            <p>共处理 {summary.total} 个 Illustrator 文件。输出内容已经写入新的运行目录。</p>
          </div>

          <div className="stats-grid">
            <div className="stat success"><strong>{summary.success}</strong><span>完整打包</span></div>
            <div className="stat partial"><strong>{summary.partial}</strong><span>缺失部分素材</span></div>
            <div className="stat failed"><strong>{summary.failed}</strong><span>失败</span></div>
          </div>

          <div className="result-location">
            <div className="path-icon"><Icon name="folder" /></div>
            <div>
              <small>打包目录</small>
              <strong>{prepared?.runRoot}</strong>
            </div>
          </div>

          {packageResult.rows.some((row) => row.status !== "success") && (
            <div className="issue-list">
              <h3>需要留意的文件</h3>
              {packageResult.rows.filter((row) => row.status !== "success").map((row) => (
                <div className="issue-row" key={row.aiPath}>
                  <span className={`issue-icon ${row.status}`}><Icon name={row.status === "failed" ? "error" : "warning"} /></span>
                  <div>
                    <strong>{basename(row.aiPath)}</strong>
                    <small>{row.status === "failed" ? row.errorMessage || "Illustrator 处理失败" : `缺失 ${row.missingLinkCount} 个链接素材`}</small>
                    {row.missingPaths.length > 0 && <span className="missing-paths">{row.missingPaths.map(basename).join("、")}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <details className="technical-details">
            <summary>查看技术详情</summary>
            <div className="technical-grid">
              <span>CSV 报告</span><code>{packageResult.csvReportPath}</code>
              <span>Illustrator 模式</span><code>{runResult?.mode ?? "-"}</code>
              <span>状态信息</span><code>{runResult?.message ?? "-"}</code>
            </div>
            {runResult?.stderr && <pre>{runResult.stderr}</pre>}
          </details>

          <div className="completion-actions">
            <button onClick={() => { setPackageResult(undefined); setPrepared(undefined); setRunResult(undefined); setStatus("可以调整选择后重新打包。" ); }}>返回文件列表</button>
            <button onClick={() => prepared?.runRoot && window.aiLinkPackager.openOutputFolder(prepared.runRoot)}>打开打包文件夹</button>
            <button className="primary" onClick={() => { setInputs([]); setOutputRoot(""); setRunName("AI打包文件"); setAiFiles([]); setSelectedPaths(new Set()); resetRunState(); setStatus("添加 Illustrator 文件或包含 AI 文件的文件夹。" ); }}>开始新的打包</button>
          </div>
        </section>
      )}

      <footer className="status-footer">
        <span className="status-dot" />
        <span>{status}</span>
      </footer>
    </main>
  );
}
