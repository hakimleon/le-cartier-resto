
"use client";

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import type { Recipe, Preparation, FullRecipeIngredient, FullRecipePreparation } from '@/lib/types';

// On peut enregistrer des polices, mais pour la simplicité, on utilise les polices standards.
// Font.register({ family: 'Oswald', src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf' });

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 35,
    paddingLeft: 35,
    paddingRight: 35,
    paddingBottom: 40,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottom: '2px solid #EEE',
    paddingBottom: 10,
  },
  titleContainer: {
    width: '70%',
  },
  mainTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#666',
  },
  metaContainer: {
    width: '30%',
    textAlign: 'right',
  },
  metaText: {
    fontSize: 9,
    marginBottom: 3,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#b8945e',
    marginBottom: 8,
    borderBottom: '1px solid #EEE',
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 10,
  },
  text: {
    lineHeight: 1.5,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#EEE'
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#F7F7F7',
    padding: 5,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  procedureText: {
    fontSize: 10,
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 35,
    right: 35,
    textAlign: 'center',
    color: 'grey',
    fontSize: 8,
  }
});


const MarkdownToPDF = ({ text }: { text?: string }) => {
    if (!text) return null;
    const lines = text.split('\n');
    
    return (
        <View>
            {lines.map((line, i) => {
                if (line.startsWith('### ')) {
                    return <Text key={i} style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, marginTop: 8, marginBottom: 4 }}>{line.substring(4)}</Text>;
                }
                if (line.startsWith('- ')) {
                    return <Text key={i} style={{...styles.procedureText, paddingLeft: 10 }}>• {line.substring(2)}</Text>;
                }
                return <Text key={i} style={styles.procedureText}>{line}</Text>;
            })}
        </View>
    )
}

interface RecipePDFDocumentProps {
    recipe: Recipe | Preparation;
    ingredients: FullRecipeIngredient[];
    preparations: FullRecipePreparation[];
    totalCost: number;
}

export const RecipePDFDocument = ({ recipe, ingredients, preparations, totalCost }: RecipePDFDocumentProps) => {
    const isPlat = recipe.type === 'Plat';

    return (
        <Document title={recipe.name} author="Le Cartier">
            <Page size="A4" style={styles.page}>
                {/* En-tête */}
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.mainTitle}>{recipe.name}</Text>
                        <Text style={styles.subtitle}>{recipe.description}</Text>
                    </View>
                    <View style={styles.metaContainer}>
                        <Text style={styles.metaText}><Text style={styles.bold}>Catégorie :</Text> {recipe.category}</Text>
                        <Text style={styles.metaText}><Text style={styles.bold}>Difficulté :</Text> {recipe.difficulty}</Text>
                        <Text style={styles.metaText}><Text style={styles.bold}>Durée :</Text> {recipe.duration} min</Text>
                         {isPlat ? (
                            <Text style={styles.metaText}><Text style={styles.bold}>Portions :</Text> {(recipe as Recipe).portions}</Text>
                        ) : (
                            <Text style={styles.metaText}><Text style={styles.bold}>Production :</Text> {(recipe as Preparation).productionQuantity} {(recipe as Preparation).productionUnit}</Text>
                        )}
                    </View>
                </View>

                {/* Section Coûts */}
                <View style={styles.section}>
                    <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold' }}>Coût matière total : {totalCost.toFixed(2)} DZD</Text>
                    {isPlat && (
                        <Text style={{ fontSize: 10, color: '#444' }}>Coût par portion : {(totalCost / (recipe as Recipe).portions).toFixed(2)} DZD</Text>
                    )}
                </View>

                 {/* Section Ingrédients */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ingrédients</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={{...styles.tableColHeader, width: '55%'}}><Text style={styles.bold}>Nom</Text></View>
                            <View style={styles.tableColHeader}><Text style={styles.bold}>Quantité</Text></View>
                            <View style={styles.tableColHeader}><Text style={styles.bold}>Unité</Text></View>
                        </View>
                        {ingredients.map(ing => (
                            <View style={styles.tableRow} key={ing.id}>
                                <View style={{...styles.tableCol, width: '55%'}}><Text>{ing.name}</Text></View>
                                <View style={styles.tableCol}><Text>{ing.quantity}</Text></View>
                                <View style={styles.tableCol}><Text>{ing.unit}</Text></View>
                            </View>
                        ))}
                    </View>
                </View>
                
                 {preparations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sous-Recettes</Text>
                        <View style={styles.table}>
                             <View style={styles.tableRow}>
                                <View style={{...styles.tableColHeader, width: '55%'}}><Text style={styles.bold}>Nom</Text></View>
                                <View style={styles.tableColHeader}><Text style={styles.bold}>Quantité</Text></View>
                                <View style={styles.tableColHeader}><Text style={styles.bold}>Unité</Text></View>
                            </View>
                            {preparations.map(prep => (
                                <View style={styles.tableRow} key={prep.id}>
                                    <View style={{...styles.tableCol, width: '55%'}}><Text>{prep.name}</Text></View>
                                    <View style={styles.tableCol}><Text>{prep.quantity}</Text></View>
                                    <View style={styles.tableCol}><Text>{prep.unit}</Text></View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}


                {/* Section Procédure */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Procédure</Text>
                    <View>
                        {recipe.procedure_preparation && <MarkdownToPDF text={`### Préparation\n${recipe.procedure_preparation}`} />}
                        {recipe.procedure_cuisson && <MarkdownToPDF text={`### Cuisson\n${recipe.procedure_cuisson}`} />}
                        {recipe.procedure_service && <MarkdownToPDF text={`### Service / Dressage\n${recipe.procedure_service}`} />}
                    </View>
                </View>
                
                <Text style={styles.footer} fixed>Fiche Technique - Le Cartier - Générée le {new Date().toLocaleDateString('fr-FR')}</Text>
            </Page>
        </Document>
    );
};
