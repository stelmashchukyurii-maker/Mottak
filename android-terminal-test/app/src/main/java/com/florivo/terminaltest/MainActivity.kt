package com.florivo.terminaltest

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = FlorivoBg) {
                    FlorivoLocalTestApp()
                }
            }
        }
    }
}

private val FlorivoBg = Color(0xFF10291F)
private val FlorivoBg2 = Color(0xFF28553B)
private val Card = Color(0xFFFFFDF4)
private val Ink = Color(0xFF24261D)
private val Muted = Color(0xFF6D6B58)
private val GreenEdge = Color(0xFF245D35)
private val RedEdge = Color(0xFF6F1C18)

private data class Product(
    val key: String,
    val name: String,
    val icon: String,
    val wide: Boolean = false
)

@Composable
private fun FlorivoLocalTestApp() {
    var lang by remember { mutableStateOf("NO") }
    var vrakMode by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<Product?>(null) }
    var localNumber by remember { mutableIntStateOf(0) }

    LaunchedEffect(selected) {
        if (selected != null) {
            delay(3000)
            selected = null
            vrakMode = false
        }
    }

    val products = listOf(
        Product("bunner", "BUNNER", "▰", wide = true),
        Product("hyller30", "HYLLER x30", "▤"),
        Product("hyller60", "HYLLER x60", "▤"),
        Product("forlengere_korte", "FORLENGERE\nKORTE", "↔"),
        Product("forlengere_lange", "FORLENGERE\nLANGE", "⟷"),
        Product("forlengere_plast", "FORLENGERE\nPLAST", "◫", wide = true)
    )

    val vrakProducts = listOf(
        Product("vrak_bunner", "VRAK BUNNER", "✕"),
        Product("vrak_hyller", "VRAK HYLLER", "✕"),
        Product("bunner_uten_brikk", "BUNNER UTEN BRIKK", "!", wide = true)
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(FlorivoBg, FlorivoBg2)))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Header(lang = lang, onLang = { lang = it })

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(12.dp, RoundedCornerShape(25.dp))
                    .background(Card, RoundedCornerShape(25.dp))
                    .padding(16.dp)
            ) {
                EmployeeCard(lang)

                Text(
                    text = if (vrakMode) "VRAK / AVVIK" else if (lang == "NO") "Velg produkt" else "Оберіть продукт",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 18.dp, bottom = 4.dp),
                    color = if (vrakMode) Color(0xFF8B241F) else Color(0xFF29411E),
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black,
                    textAlign = TextAlign.Center
                )

                Text(
                    text = if (vrakMode) {
                        if (lang == "NO") "Velg type avvik. Dette er bare lokal TEST." else "Оберіть тип відхилення. Це лише локальний TEST."
                    } else {
                        if (lang == "NO") "Trykk én gang når ferdig produkt er klart. Ingen data sendes." else "Натисніть один раз для готового продукту. Дані нікуди не надсилаються."
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    color = Muted,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center
                )

                if (!vrakMode) {
                    ProductGrid(products) { product ->
                        localNumber += 1
                        selected = product
                    }

                    Spacer(Modifier.height(18.dp))

                    FlorivoActionButton(
                        text = "VRAK / AVVIK",
                        subText = if (lang == "NO") "Åpne rødt avviksskjermbilde" else "Відкрити червоний екран відхилень",
                        icon = "!",
                        danger = true,
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { vrakMode = true }
                    )
                } else {
                    ProductGrid(vrakProducts, danger = true) { product ->
                        localNumber += 1
                        selected = product
                    }

                    Spacer(Modifier.height(18.dp))

                    FlorivoActionButton(
                        text = if (lang == "NO") "TILBAKE" else "НАЗАД",
                        subText = if (lang == "NO") "Til produkter" else "До продуктів",
                        icon = "←",
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { vrakMode = false }
                    )
                }
            }

            Text(
                text = if (lang == "NO") {
                    "Florivo Android · LOKAL TEST v0.1 · Ingen NFC · Ingen server · Ingen WORK-data"
                } else {
                    "Florivo Android · ЛОКАЛЬНИЙ TEST v0.1 · Без NFC · Без сервера · Без WORK-даних"
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                color = Color(0xFFD9EDC9),
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
        }

        selected?.let { product ->
            ConfirmationOverlay(
                product = product,
                number = localNumber,
                lang = lang,
                danger = product.key.startsWith("vrak_") || product.key == "bunner_uten_brikk"
            )
        }
    }
}

@Composable
private fun Header(lang: String, onLang: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "FLORIVO TERMINAL",
                color = Color.White,
                fontSize = 27.sp,
                fontWeight = FontWeight.Black
            )
            Text(
                text = "Ferdig produkt · Android lokal TEST",
                color = Color.White.copy(alpha = 0.78f),
                fontSize = 13.sp
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            LangPill("NO", lang == "NO") { onLang("NO") }
            LangPill("УКР", lang == "UK") { onLang("UK") }
        }

        Spacer(Modifier.padding(3.dp))

        Box(
            modifier = Modifier
                .background(
                    Brush.radialGradient(listOf(Color(0xFFFFF57A), Color(0xFFD8E94D), Color(0xFF4D9952))),
                    RoundedCornerShape(50)
                )
                .border(1.dp, Color(0xFF24623A), RoundedCornerShape(50))
                .padding(horizontal = 10.dp, vertical = 7.dp)
        ) {
            Text("TEST", color = Color(0xFF173B24), fontSize = 12.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun LangPill(text: String, active: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(if (active) Color(0xFFD9E94D) else Color.White.copy(alpha = 0.10f))
            .border(1.dp, if (active) Color(0xFF2F7042) else Color.White.copy(alpha = 0.22f), RoundedCornerShape(50))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 7.dp)
    ) {
        Text(
            text = text,
            color = if (active) Color(0xFF17371F) else Color.White,
            fontSize = 12.sp,
            fontWeight = FontWeight.Black
        )
    }
}

@Composable
private fun EmployeeCard(lang: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(19.dp))
            .border(2.dp, Color(0xFFE7DDB8), RoundedCornerShape(19.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.radialGradient(listOf(Color.White, Color(0xFFD8E94E), Color(0xFF5AA25B))),
                    RoundedCornerShape(50)
                )
                .border(2.dp, Color(0xFF2E7443), RoundedCornerShape(50))
                .padding(horizontal = 16.dp, vertical = 14.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("TEST", color = Color(0xFF173A23), fontSize = 13.sp, fontWeight = FontWeight.Black)
        }

        Column(modifier = Modifier.padding(start = 13.dp)) {
            Text(
                text = if (lang == "NO") "UTEN KORT · LOKAL TEST" else "БЕЗ КАРТКИ · ЛОКАЛЬНИЙ TEST",
                color = Ink,
                fontSize = 19.sp,
                fontWeight = FontWeight.Black
            )
            Text(
                text = if (lang == "NO") "Ingen innlogging eller tillatelser i denne versjonen" else "У цій версії немає входу чи дозволів",
                color = Muted,
                fontSize = 12.sp,
                modifier = Modifier.padding(top = 3.dp)
            )
        }
    }
}

@Composable
private fun ProductGrid(
    products: List<Product>,
    danger: Boolean = false,
    onClick: (Product) -> Unit
) {
    var index = 0
    while (index < products.size) {
        val first = products[index]
        if (first.wide) {
            FlorivoActionButton(
                text = first.name,
                subText = if (danger) "Lokal avvikstest" else "Ferdig produkt +1 · lokal test",
                icon = first.icon,
                danger = danger,
                modifier = Modifier.fillMaxWidth(),
                onClick = { onClick(first) }
            )
            Spacer(Modifier.height(14.dp))
            index += 1
        } else {
            val second = products.getOrNull(index + 1)?.takeIf { !it.wide }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                FlorivoActionButton(
                    text = first.name,
                    subText = if (danger) "Lokal avvikstest" else "Ferdig produkt +1",
                    icon = first.icon,
                    danger = danger,
                    modifier = Modifier.weight(1f),
                    onClick = { onClick(first) }
                )
                if (second != null) {
                    FlorivoActionButton(
                        text = second.name,
                        subText = if (danger) "Lokal avvikstest" else "Ferdig produkt +1",
                        icon = second.icon,
                        danger = danger,
                        modifier = Modifier.weight(1f),
                        onClick = { onClick(second) }
                    )
                } else {
                    Spacer(Modifier.weight(1f))
                }
            }
            Spacer(Modifier.height(14.dp))
            index += if (second != null) 2 else 1
        }
    }
}

@Composable
private fun FlorivoActionButton(
    text: String,
    subText: String,
    icon: String,
    modifier: Modifier = Modifier,
    danger: Boolean = false,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(23.dp)
    val colors = if (danger) {
        listOf(Color(0xFFFF9C91), Color(0xFFEE6359), Color(0xFFBD332D), Color(0xFF731E1A))
    } else {
        listOf(Color(0xFFFFF96B), Color(0xFFF7E84C), Color(0xFF8FC449), Color(0xFF2D7140))
    }

    Box(
        modifier = modifier
            .heightIn(min = if (text.contains("\n")) 122.dp else 104.dp)
            .shadow(8.dp, shape)
            .clip(shape)
            .background(Brush.radialGradient(colors))
            .border(2.dp, if (danger) RedEdge else GreenEdge, shape)
            .clickable(onClick = onClick)
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = icon,
                color = if (danger) Color.White else Color(0xFF17341F),
                fontSize = 31.sp,
                fontWeight = FontWeight.Black
            )
            Column {
                Text(
                    text = text,
                    color = if (danger) Color.White else Color(0xFF18341F),
                    fontSize = 21.sp,
                    fontWeight = FontWeight.Black,
                    lineHeight = 22.sp
                )
                Text(
                    text = subText,
                    color = if (danger) Color.White.copy(alpha = 0.90f) else Color(0xFF315329),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 5.dp)
                )
            }
        }
    }
}

@Composable
private fun ConfirmationOverlay(product: Product, number: Int, lang: String, danger: Boolean) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xF20C2119))
            .padding(22.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(14.dp, RoundedCornerShape(30.dp))
                .background(
                    if (danger) {
                        Brush.radialGradient(listOf(Color(0xFFFFAAA0), Color(0xFFEB6258), Color(0xFF6C1D1A)))
                    } else {
                        Brush.radialGradient(listOf(Color(0xFFFFF97C), Color(0xFFE2E94F), Color(0xFF326F43)))
                    },
                    RoundedCornerShape(30.dp)
                )
                .border(3.dp, if (danger) RedEdge else Color(0xFF245C37), RoundedCornerShape(30.dp))
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(if (danger) "!" else "✓", fontSize = 68.sp, fontWeight = FontWeight.Black, color = if (danger) Color.White else Color(0xFF17351F))
            Text(
                text = if (lang == "NO") "LOKAL TEST REGISTRERT" else "ЛОКАЛЬНИЙ TEST ЗАРЕЄСТРОВАНО",
                color = if (danger) Color.White else Color(0xFF17351F),
                fontSize = 23.sp,
                fontWeight = FontWeight.Black,
                textAlign = TextAlign.Center
            )
            Text(
                text = "%06d".format(number),
                color = if (danger) Color.White else Color(0xFF17351F),
                fontSize = 58.sp,
                fontWeight = FontWeight.Black,
                modifier = Modifier.padding(vertical = 8.dp)
            )
            Text(
                text = product.name.replace("\n", " "),
                color = if (danger) Color.White else Color(0xFF25442B),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            Text(
                text = if (lang == "NO") "Ingen data er sendt. Tilbake om 3 sekunder." else "Дані нікуди не надіслані. Повернення через 3 секунди.",
                color = if (danger) Color.White.copy(alpha = 0.90f) else Color(0xFF34573B),
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 16.dp)
            )
        }
    }
}
