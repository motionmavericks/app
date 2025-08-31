# Data Model

Entities
- Organization, Client, Project, Collection(type), Asset, Version, Sidecar, Share, Task, Activity.

Notes
- `Version` carries `sha256`, `size`, `container`, `codec`, `tc_in/out`, color metadata.
- `Sidecar` links to XMP/XML/IMF CPL, etc.

ER Sketch (text)
- Organization 1—* Client 1—* Project 1—* Collection 1—* Asset 1—* Version
- Asset 1—* Sidecar; Project 1—* Share; Project 1—* Task; Project 1—* Activity

Glossary
- collection.type: `00-project | 01-footage | 02-audio | 03-graphics | 00-exports`.
- asset.identity: stable UUID; version.identity: content SHA256.

See Also
- Database overview and DDL sketches in `docs/database/*`.
