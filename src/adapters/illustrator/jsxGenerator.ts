function toJsxPath(input: string): string {
  return input.replace(/\\/g, "/").replace(/"/g, "\\\"");
}

export function generateIllustratorRunnerJsx(options: { jobsJsonPath: string; reportJsonlPath: string }): string {
  const jobsJsonPath = toJsxPath(options.jobsJsonPath);
  const reportJsonlPath = toJsxPath(options.reportJsonlPath);

  return `#target illustrator
(function () {
  var jobsJsonPath = "${jobsJsonPath}";
  var reportJsonlPath = "${reportJsonlPath}";
  var debugLogPath = reportJsonlPath.replace(/\\/[^\\/]*$/, "/runner_debug.txt");
  var previousInteractionLevel = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

  function debugLog(message) {
    try {
      var file = new File(debugLogPath);
      file.encoding = "UTF-8";
      if (file.open("a")) {
        file.writeln(String(new Date()) + " " + message);
        file.close();
      }
    } catch (logError) {}
  }

  function readText(filePath) {
    var file = new File(filePath);
    file.encoding = "UTF-8";
    if (!file.open("r")) throw new Error("Cannot open jobs file: " + filePath);
    var text = file.read();
    file.close();
    return text;
  }

  function parsePayload(text) {
    return eval("(" + text + ")");
  }

  function jsonString(value) {
    var slash = String.fromCharCode(92);
    var quote = String.fromCharCode(34);
    var text = String(value === undefined || value === null ? "" : value);
    text = text.replace(/\\\\/g, slash + slash);
    text = text.replace(/"/g, slash + quote);
    text = text.replace(/\\r/g, slash + "r");
    text = text.replace(/\\n/g, slash + "n");
    text = text.replace(/\\t/g, slash + "t");
    return quote + text + quote;
  }

  function jsonStringArray(values) {
    var parts = [];
    for (var i = 0; i < values.length; i += 1) {
      parts.push(jsonString(values[i]));
    }
    return "[" + parts.join(",") + "]";
  }

  function reportRowToJson(row) {
    return "{" + [
      jsonString("aiPath") + ":" + jsonString(row.aiPath),
      jsonString("status") + ":" + jsonString(row.status),
      jsonString("linkCount") + ":" + Number(row.linkCount || 0),
      jsonString("foundLinkCount") + ":" + Number(row.foundLinkCount || 0),
      jsonString("missingLinkCount") + ":" + Number(row.missingLinkCount || 0),
      jsonString("missingPaths") + ":" + jsonStringArray(row.missingPaths || []),
      jsonString("outputDir") + ":" + jsonString(row.outputDir),
      jsonString("errorMessage") + ":" + jsonString(row.errorMessage)
    ].join(",") + "}";
  }

  function appendJsonLine(filePath, value) {
    var file = new File(filePath);
    file.encoding = "UTF-8";
    file.open("a");
    file.writeln(reportRowToJson(value));
    file.close();
  }

  function ensureFolder(folderPath) {
    var folder = new Folder(folderPath);
    if (!folder.exists && !folder.create()) {
      throw new Error("Cannot create folder: " + folderPath);
    }
  }

  function uniqueFile(folderPath, fileName) {
    var parsed = fileName.match(/^(.*?)(\\.[^.]*)?$/);
    var base = parsed && parsed[1] ? parsed[1] : fileName;
    var ext = parsed && parsed[2] ? parsed[2] : "";
    var candidate = new File(folderPath + "/" + fileName);
    var index = 2;
    while (candidate.exists) {
      candidate = new File(folderPath + "/" + base + "_" + index + ext);
      index += 1;
    }
    return candidate;
  }

  function normalizedPath(file) {
    return String(file.fsName || file.fullName || "").replace(/\\\\/g, "/").toLowerCase();
  }

  function sameFile(left, right) {
    return normalizedPath(left) === normalizedPath(right);
  }

  function processJob(job) {
    var doc = null;
    var missing = [];
    var packageErrors = [];
    var linkCount = 0;
    var foundCount = 0;

    try {
      debugLog("start job: " + job.aiPath);
      ensureFolder(job.outputDir);
      ensureFolder(job.linksDir);

      var sourceFile = new File(job.aiPath);
      var outputFile = new File(job.outputAiPath);
      if (sameFile(outputFile, sourceFile)) {
        throw new Error("Output AI path matches source AI path: " + job.outputAiPath);
      }

      debugLog("open source document: " + job.aiPath);
      var document = app.open(sourceFile);
      doc = document;
      var items = document.placedItems;
      linkCount = items.length;
      debugLog("placed items: " + linkCount);

      for (var i = 0; i < items.length; i += 1) {
        var item = items[i];
        if (!item.file) {
          missing.push("[no file object]");
          continue;
        }

        var source = new File(item.file.fsName);
        if (!source.exists) {
          missing.push(item.file.fsName);
          continue;
        }

        var copied = uniqueFile(job.linksDir, source.displayName || source.name);
        try {
          if (!source.copy(copied)) {
            packageErrors.push("Cannot copy linked file: " + item.file.fsName);
            continue;
          }
        } catch (copyError) {
          packageErrors.push("Cannot copy linked file: " + item.file.fsName + " (" + String(copyError && copyError.message ? copyError.message : copyError) + ")");
          continue;
        }

        try {
          item.relink(copied);
        } catch (relinkError) {
          packageErrors.push("Cannot relink copied file: " + item.file.fsName + " (" + String(relinkError && relinkError.message ? relinkError.message : relinkError) + ")");
          continue;
        }

        foundCount += 1;
      }

      debugLog("save packaged document: " + job.outputAiPath);
      doc.saveAs(outputFile);
      doc.close(SaveOptions.DONOTSAVECHANGES);
      doc = null;
      debugLog("finish job: " + job.aiPath);

      return {
        aiPath: job.aiPath,
        status: missing.length > 0 || packageErrors.length > 0 ? "partial_success" : "success",
        linkCount: linkCount,
        foundLinkCount: foundCount,
        missingLinkCount: missing.length,
        missingPaths: missing,
        outputDir: job.outputDir,
        errorMessage: packageErrors.join("; ")
      };
    } catch (error) {
      if (doc) {
        try {
          doc.close(SaveOptions.DONOTSAVECHANGES);
        } catch (closeError) {}
      }
      return {
        aiPath: job.aiPath,
        status: "failed",
        linkCount: linkCount,
        foundLinkCount: foundCount,
        missingLinkCount: missing.length,
        missingPaths: missing,
        outputDir: job.outputDir,
        errorMessage: packageErrors.length > 0 ? packageErrors.join("; ") + "; " + String(error && error.message ? error.message : error) : String(error && error.message ? error.message : error)
      };
    }
  }

  try {
    debugLog("runner start");
    var payload = parsePayload(readText(jobsJsonPath));
    debugLog("parsed jobs: " + payload.jobs.length);
    for (var j = 0; j < payload.jobs.length; j += 1) {
      appendJsonLine(reportJsonlPath, processJob(payload.jobs[j]));
    }
    debugLog("runner finish");
  } catch (runnerError) {
    debugLog("fatal runner error: " + String(runnerError && runnerError.message ? runnerError.message : runnerError));
    appendJsonLine(reportJsonlPath, {
      aiPath: "[runner]",
      status: "failed",
      linkCount: 0,
      foundLinkCount: 0,
      missingLinkCount: 0,
      missingPaths: [],
      outputDir: "",
      errorMessage: "Fatal runner error: " + String(runnerError && runnerError.message ? runnerError.message : runnerError)
    });
  } finally {
    app.userInteractionLevel = previousInteractionLevel;
  }
})();`;
}
