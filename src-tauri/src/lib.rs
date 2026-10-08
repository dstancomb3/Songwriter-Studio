use serde::Serialize;
use serde_json::Value;
use std::{
    fs,
    path::{
        Path,
        PathBuf,
    },
};
use tauri::Manager;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SavedSongSummary {
    file_name: String,
    song_id: String,
    title: String,
    artist: String,
    genre: String,
    key: String,
    tempo: f64,
    updated_at: String,
    section_count: usize,
}

fn songs_dir(
    app: &tauri::AppHandle,
) -> Result<PathBuf, String> {
    let documents =
        app.path()
            .document_dir()
            .map_err(|error| {
                format!(
                    "Unable to locate the Documents folder: {error}"
                )
            })?;

    let directory =
        documents
            .join("Songwriter Studio")
            .join("Songs");

    fs::create_dir_all(
        &directory
    )
    .map_err(|error| {
        format!(
            "Unable to create the Songs folder: {error}"
        )
    })?;

    Ok(directory)
}

fn safe_song_file_name(
    song_id: &str,
) -> Result<String, String> {
    let safe: String =
        song_id
            .chars()
            .filter(|character| {
                character.is_ascii_alphanumeric()
                    || *character == '-'
                    || *character == '_'
            })
            .collect();

    if safe.is_empty() {
        return Err(
            "The song has an invalid ID.".to_string()
        );
    }

    Ok(format!(
        "{safe}.songwriter.json"
    ))
}

fn file_in_songs_dir(
    app: &tauri::AppHandle,
    file_name: &str,
) -> Result<PathBuf, String> {
    let candidate =
        Path::new(file_name);

    if candidate.components().count() != 1
        || !file_name.ends_with(
            ".songwriter.json"
        )
    {
        return Err(
            "Invalid saved song filename.".to_string()
        );
    }

    Ok(
        songs_dir(app)?
            .join(file_name)
    )
}

#[tauri::command]
fn save_song_to_library(
    app: tauri::AppHandle,
    song_json: String,
) -> Result<SavedSongSummary, String> {
    let song: Value =
        serde_json::from_str(
            &song_json
        )
        .map_err(|error| {
            format!(
                "Unable to read song data: {error}"
            )
        })?;

    let song_id =
        song.get("id")
            .and_then(Value::as_str)
            .ok_or_else(|| {
                "The song is missing an ID.".to_string()
            })?;

    let file_name =
        safe_song_file_name(
            song_id
        )?;

    let path =
        songs_dir(&app)?
            .join(&file_name);

    let pretty =
        serde_json::to_string_pretty(
            &song
        )
        .map_err(|error| {
            format!(
                "Unable to serialize song data: {error}"
            )
        })?;

    fs::write(
        &path,
        pretty,
    )
    .map_err(|error| {
        format!(
            "Unable to save the song: {error}"
        )
    })?;

    summarize_song(
        &song,
        file_name,
    )
}

fn summarize_song(
    song: &Value,
    file_name: String,
) -> Result<SavedSongSummary, String> {
    let string_field =
        |name: &str| {
            song.get(name)
                .and_then(
                    Value::as_str
                )
                .unwrap_or("")
                .to_string()
        };

    let song_id =
        string_field("id");

    if song_id.is_empty() {
        return Err(
            "Saved song is missing an ID.".to_string()
        );
    }

    let section_count =
        song.get("sections")
            .and_then(
                Value::as_array
            )
            .map(
                |sections|
                    sections.len()
            )
            .unwrap_or(0);

    Ok(
        SavedSongSummary {
            file_name,
            song_id,
            title:
                string_field(
                    "title"
                ),
            artist:
                string_field(
                    "artist"
                ),
            genre:
                string_field(
                    "genre"
                ),
            key:
                string_field(
                    "key"
                ),
            tempo:
                song.get("tempo")
                    .and_then(
                        Value::as_f64
                    )
                    .unwrap_or(0.0),
            updated_at:
                string_field(
                    "updatedAt"
                ),
            section_count,
        }
    )
}

#[tauri::command]
fn list_saved_songs(
    app: tauri::AppHandle,
) -> Result<Vec<SavedSongSummary>, String> {
    let directory =
        songs_dir(&app)?;

    let entries =
        fs::read_dir(
            &directory
        )
        .map_err(|error| {
            format!(
                "Unable to read the Songs folder: {error}"
            )
        })?;

    let mut songs =
        Vec::new();

    for entry_result in entries {
        let entry =
            match entry_result {
                Ok(entry) => entry,
                Err(_) => continue,
            };

        let path =
            entry.path();

        if !path.is_file() {
            continue;
        }

        let file_name =
            match path.file_name()
                .and_then(
                    |name|
                        name.to_str()
                ) {
                Some(name)
                    if name.ends_with(
                        ".songwriter.json"
                    ) =>
                {
                    name.to_string()
                }
                _ => continue,
            };

        let text =
            match fs::read_to_string(
                &path
            ) {
                Ok(text) => text,
                Err(_) => continue,
            };

        let song: Value =
            match serde_json::from_str(
                &text
            ) {
                Ok(song) => song,
                Err(_) => continue,
            };

        if let Ok(summary) =
            summarize_song(
                &song,
                file_name,
            )
        {
            songs.push(
                summary
            );
        }
    }

    songs.sort_by(
        |left, right| {
            right.updated_at
                .cmp(
                    &left.updated_at
                )
                .then_with(|| {
                    left.title
                        .to_lowercase()
                        .cmp(
                            &right.title
                                .to_lowercase()
                        )
                })
        }
    );

    Ok(songs)
}

#[tauri::command]
fn load_song_from_library(
    app: tauri::AppHandle,
    file_name: String,
) -> Result<String, String> {
    let path =
        file_in_songs_dir(
            &app,
            &file_name,
        )?;

    fs::read_to_string(
        path
    )
    .map_err(|error| {
        format!(
            "Unable to open the saved song: {error}"
        )
    })
}

#[tauri::command]
fn get_songs_directory(
    app: tauri::AppHandle,
) -> Result<String, String> {
    songs_dir(&app)?
        .to_str()
        .map(
            ToOwned::to_owned
        )
        .ok_or_else(|| {
            "The Songs folder path contains unsupported characters."
                .to_string()
        })
}

#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(
            tauri::generate_handler![
                save_song_to_library,
                list_saved_songs,
                load_song_from_library,
                get_songs_directory,
            ]
        )
        .run(
            tauri::generate_context!()
        )
        .expect(
            "error while running Songwriter Studio"
        );
}
